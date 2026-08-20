import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("supports keyboard, focus-managed dialogs, reduced motion, and reflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = 10;
      contextWindow = 100;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(5); }
      promptStreaming() {
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Accessible response");
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  await page.goto("/assistant");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await expect(page.getByLabel("Message the local assistant")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Settings" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Assistant settings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Settings" })).toBeFocused();
  await page.getByLabel("Message the local assistant").fill("Keyboard and status check");
  await page.getByRole("button", { name: "Send message" }).press("Enter");
  await expect(page.getByRole("status")).toContainText("Response complete");
  await expect(page.getByLabel("Conversation transcript")).toHaveAttribute("aria-busy", "false");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
