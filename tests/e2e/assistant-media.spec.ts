import { expect, test, type Page } from "@playwright/test";

type MediaTestWindow = typeof globalThis & { __assistantInputs?: unknown[] };

function installMediaModel(page: Page): void {
  void page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() {
        return Promise.resolve("available");
      }

      static create() {
        return Promise.resolve(new FakeLanguageModel());
      }

      contextUsage = 10;
      contextWindow = 1_000;

      destroy() {}
      addEventListener() {}
      removeEventListener() {}

      measureContextUsage(input: unknown) {
        const target = globalThis as MediaTestWindow;
        target.__assistantInputs = [...(target.__assistantInputs ?? []), input];
        return Promise.resolve(20);
      }

      promptStreaming(input: unknown) {
        const target = globalThis as MediaTestWindow;
        target.__assistantInputs = [...(target.__assistantInputs ?? []), input];
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Media accepted locally.");
            controller.close();
          },
        });
      }
    }

    Object.defineProperty(globalThis, "LanguageModel", {
      configurable: true,
      value: FakeLanguageModel,
    });
  });
}

test("analyzes an image for one turn and requires reattachment for later analysis", async ({ page }) => {
  installMediaModel(page);
  await page.goto("/assistant");
  const imageInput = page.getByLabel("Choose media attachments");
  await imageInput.setInputFiles({
    name: "diagram.png",
    mimeType: "image/png",
    buffer: Buffer.from([1, 2, 3]),
  });
  await expect(page.getByText("diagram.png", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Message the local assistant").fill("Describe this image");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Media accepted locally.", { exact: true })).toBeVisible();

  const inputs = await page.evaluate(() => (globalThis as MediaTestWindow).__assistantInputs ?? []);
  expect(JSON.stringify(inputs)).toContain('"type":"image"');
  await expect(page.getByText("diagram.png (image/png)", { exact: true })).toBeVisible();
  await page.getByLabel("Message the local assistant").fill("What did you say?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Media accepted locally.", { exact: true })).toHaveCount(2);
});

test("analyzes audio locally without making a media request", async ({ page }) => {
  const leaks: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("note.wav")) leaks.push(request.url());
  });
  installMediaModel(page);
  await page.goto("/assistant");
  await page.getByLabel("Choose media attachments").setInputFiles({
    name: "note.wav",
    mimeType: "audio/wav",
    buffer: Buffer.from([1, 2, 3]),
  });
  await expect(page.getByText("note.wav", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Message the local assistant").fill("Describe this recording");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Media accepted locally.", { exact: true })).toBeVisible();
  expect(leaks).toEqual([]);
});

test("accepts a supported file dropped anywhere in the conversation", async ({ page }) => {
  installMediaModel(page);
  await page.goto("/assistant");
  const dropzone = page.locator("[data-assistant-dropzone]");

  await dropzone.evaluate((element) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File([new Uint8Array([1, 2, 3])], "dropped.png", { type: "image/png" }),
    );
    element.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer }));
    element.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer }));
  });
  await expect(page.getByText("Drop to attach", { exact: true })).toBeVisible();

  await dropzone.evaluate((element) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File([new Uint8Array([1, 2, 3])], "dropped.png", { type: "image/png" }),
    );
    element.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer }));
  });
  await expect(page.getByText("dropped.png", { exact: true }).first()).toBeVisible();
});
