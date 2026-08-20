import { expect, test } from "@playwright/test";

test("unsupported visitors keep the full takeover without a synthetic answer", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "LanguageModel", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/assistant");

  await expect(page.getByRole("heading", { name: /not available here/i })).toBeVisible();
  await expect(page.getByText(/generated locally on this device/i)).toBeVisible();
  await expect(page.getByLabel("Message the local assistant")).toHaveCount(0);
});

test("downloadable model requires consent and reports preparation", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() {
        return Promise.resolve("downloadable");
      }

      static create(options: { monitor?: (monitor: EventTarget) => void }) {
        const monitor = new EventTarget();
        options.monitor?.(monitor);
        monitor.dispatchEvent(
          new ProgressEvent("downloadprogress", { loaded: 0.5, total: 1 }),
        );
        monitor.dispatchEvent(
          new ProgressEvent("downloadprogress", { loaded: 1, total: 1 }),
        );
        return Promise.resolve(new FakeLanguageModel());
      }

      contextUsage = 0;
      contextWindow = 1_000;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() {
        return Promise.resolve(10);
      }
      promptStreaming() {
        return new ReadableStream<string>();
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", {
      configurable: true,
      value: FakeLanguageModel,
    });
  });
  await page.goto("/assistant");

  const prepare = page.getByRole("button", { name: "Prepare on this device" });
  await expect(prepare).toBeVisible();
  await prepare.click();
  await expect(page.getByLabel("Message the local assistant")).toBeVisible();
});

test("available model initialization never appears as another download", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() {
        return Promise.resolve("available");
      }

      static create(options: { monitor?: (monitor: EventTarget) => void }) {
        const monitor = new EventTarget();
        options.monitor?.(monitor);
        monitor.dispatchEvent(new ProgressEvent("downloadprogress", { loaded: 0, total: 1 }));
        monitor.dispatchEvent(new ProgressEvent("downloadprogress", { loaded: 1, total: 1 }));
        return new Promise<FakeLanguageModel>((resolve) => {
          window.setTimeout(() => resolve(new FakeLanguageModel()), 250);
        });
      }

      contextUsage = 0;
      contextWindow = 1_000;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() {
        return Promise.resolve(10);
      }
      promptStreaming() {
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Ready without a download.");
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
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Use the ready model");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("Preparing your message…")).toBeVisible();
  await expect(page.getByText(/downloading the on-device model/i)).toHaveCount(0);
  await expect(page.getByText("Ready without a download.")).toBeVisible();
});
