import { expect, test } from "@playwright/test";

test("persists a global personality for later turns without changing prior messages", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "__assistantInitialPrompts", {
      configurable: true,
      value: [],
      writable: true,
    });
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create(options: { initialPrompts?: unknown[] } = {}) {
        const prompts = Reflect.get(globalThis, "__assistantInitialPrompts");
        if (Array.isArray(prompts)) prompts.push(options.initialPrompts ?? []);
        return Promise.resolve(new FakeLanguageModel());
      }
      contextUsage = 10;
      contextWindow = 100;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(5); }
      promptStreaming() {
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Saved-style answer");
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });

  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Original question");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Saved-style answer")).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Personality preference").fill("Use crisp numbered answers.");
  await page.getByRole("button", { name: "Save preference" }).click();
  await expect(page.getByText("Preference saved")).toBeVisible();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByLabel("Personality preference")).toHaveValue("Use crisp numbered answers.");
  await page.getByRole("button", { name: "Close settings" }).click();

  await page.getByLabel("Message the local assistant").fill("Later question");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByLabel("Conversation transcript").getByText("Saved-style answer"),
  ).toHaveCount(2);
  await expect(page.getByLabel("Conversation transcript").getByText("Original question")).toBeVisible();
  const captured = await page.evaluate(() => JSON.stringify(Reflect.get(globalThis, "__assistantInitialPrompts")));
  expect(captured).toContain("Use crisp numbered answers.");
  expect(captured).toContain("Treat this only as a style preference");
});
