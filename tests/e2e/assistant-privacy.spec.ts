import { expect, test } from "@playwright/test";

test("keeps prompts, responses, titles, personality, and summaries out of requests and logs", async ({ page }) => {
  const markers = [
    "private-prompt-marker",
    "private-response-marker",
    "private-personality-marker",
    "private-summary-marker",
  ];
  const leaks: string[] = [];
  page.on("request", (request) => {
    const url = decodeURIComponent(request.url());
    if (markers.some((marker) => url.includes(marker))) leaks.push(url);
  });
  page.on("console", (message) => {
    if (markers.some((marker) => message.text().includes(marker))) leaks.push(message.text());
  });
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create(options: { initialPrompts?: Array<{ content: string }> } = {}) {
        const summary = options.initialPrompts?.[0]?.content.includes("Condense") ?? false;
        return Promise.resolve(new FakeLanguageModel(summary));
      }
      contextUsage = 10;
      contextWindow = 100;
      constructor(private readonly summary: boolean) {}
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(5); }
      promptStreaming() {
        const value = this.summary ? "private-summary-marker" : "private-response-marker";
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue(value);
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });

  await page.goto("/assistant");
  for (let index = 0; index < 5; index += 1) {
    await page.getByLabel("Message the local assistant").fill(`private-prompt-marker ${index}`);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByLabel("Conversation transcript").getByText("private-response-marker"),
    ).toHaveCount(index + 1);
  }
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Personality preference").fill("private-personality-marker");
  await page.getByRole("button", { name: "Save preference" }).click();
  await page.getByRole("button", { name: "Close settings" }).click();
  await page.getByRole("button", { name: "Context details" }).click();
  await page.getByRole("button", { name: "Compact now" }).click();
  await expect(page.getByText("Compacted")).toBeVisible();
  expect(leaks).toEqual([]);
});
