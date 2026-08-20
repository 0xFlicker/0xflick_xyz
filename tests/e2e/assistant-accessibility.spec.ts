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
            controller.enqueue(
              "## Accessible response\n\nUse **plain words** and _natural speech_.",
            );
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  await page.goto("/assistant");
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.getByRole("button", { name: "Chats" }).click();
  }
  await expect(page.getByRole("link", { name: "Return to portfolio" })).toBeVisible();
  await expect(page.getByText("Return to portfolio", { exact: true })).toHaveCount(0);
  if ((page.viewportSize()?.width ?? 0) < 768) {
    await page.keyboard.press("Escape");
  }
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
  const composer = page.getByLabel("Message the local assistant");
  await composer.fill("Keyboard and status check");
  await composer.press("Enter");
  await expect(composer).toBeFocused();
  await expect(page.getByRole("status")).toContainText("Response complete");
  await expect(page.getByRole("status").locator(".sr-only")).toHaveText(
    "Response complete. Accessible response Use plain words and natural speech.",
  );
  await expect(page.getByLabel("Conversation transcript")).toHaveAttribute("aria-busy", "false");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
