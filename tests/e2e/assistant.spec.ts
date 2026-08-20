import { expect, test } from "@playwright/test";

test("ready local model completes a direct-route turn without prompt egress", async ({
  page,
}) => {
  const prompt = "private-e2e-prompt-7f2c";
  const leakedRequests: string[] = [];
  page.on("request", (request) => {
    if (decodeURIComponent(request.url()).includes(prompt)) leakedRequests.push(request.url());
  });
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static async availability() {
        return "available";
      }

      static async create() {
        return new FakeLanguageModel();
      }

      contextUsage = 10;
      contextWindow = 1_000;

      destroy() {}

      measureContextUsage() {
        return Promise.resolve(20);
      }

      promptStreaming() {
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("A private local response.");
            controller.close();
          },
        });
      }

      addEventListener() {}
      removeEventListener() {}
    }

    Object.defineProperty(globalThis, "LanguageModel", {
      configurable: true,
      value: FakeLanguageModel,
    });
  });

  await page.goto("/assistant");
  await expect(page.getByRole("button", { name: "Context details" })).toHaveCount(0);
  await page.getByLabel("Message the local assistant").fill(prompt);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("A private local response.")).toBeVisible();
  await expect(page.getByText("Context used")).toBeVisible();
  await expect(page.getByText(/generated locally on this device/i)).toBeVisible();
  expect(leakedRequests).toEqual([]);
});
