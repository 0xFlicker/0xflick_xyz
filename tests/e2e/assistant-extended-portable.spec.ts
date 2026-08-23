import { expect, test } from "@playwright/test";

const runExtended = process.env.ASSISTANT_EXTENDED_PORTABLE === "1";

test("ten simultaneous portable operations remain active for ten minutes without an app timeout", async ({ browser }, testInfo) => {
  test.skip(
    !runExtended || testInfo.project.name !== "desktop-chromium",
    "Set ASSISTANT_EXTENDED_PORTABLE=1 to run the ten-minute no-timeout acceptance observation.",
  );
  test.setTimeout(0);

  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "gpu", { configurable: true, value: undefined });
    const runtimeIdentity = "smollm2-135m-wasm:b8a5c0f183b78c55955a5364f610c36668b5e681:wasm:q4:1";
    window.__FLICK_ASSISTANT_PORTABLE_WORKER_FACTORY__ = () => {
      let handler: ((event: MessageEvent) => void) | null = null;
      const emit = (data: object) => handler?.({ data } as MessageEvent);
      return {
        get onmessage() { return handler; },
        set onmessage(value) { handler = value; },
        postMessage(command: { attemptId: string; kind: string }) {
          const base = { protocolVersion: 1, attemptId: command.attemptId, runtimeIdentity };
          if (command.kind === "prepare") {
            queueMicrotask(() => emit({ ...base, kind: "ready", contextLimit: 8_192 }));
          } else if (command.kind === "healthCheck") {
            queueMicrotask(() => emit({ ...base, kind: "complete", text: "ready", interrupted: false }));
          } else if (command.kind === "measure") {
            queueMicrotask(() => emit({ ...base, kind: "measurement", used: 24, capacity: 8_192 }));
          } else if (command.kind === "generate") {
            queueMicrotask(() => emit({ ...base, kind: "delta", text: "Still cooking locally." }));
          } else if (command.kind === "interrupt") {
            queueMicrotask(() => emit({ ...base, kind: "interrupted", text: "Still cooking locally." }));
          } else if (command.kind === "dispose") {
            queueMicrotask(() => emit({ ...base, kind: "disposed" }));
          }
        },
        terminate() {},
      };
    };
  });

  const pages = await Promise.all(
    Array.from({ length: 10 }, async (_, index) => {
      const page = await context.newPage();
      await page.goto("/assistant");
      await page.locator("[data-assistant-model-selector] summary").click();
      await page.getByRole("button", { name: /SmolLM2 135M/ }).click();
      await page.getByRole("button", { name: "Download and prepare" }).click();
      await page.getByLabel("Message the local assistant").fill(`Extended local operation ${index}`);
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(page.getByText("Still cooking locally.", { exact: true })).toBeVisible();
      return page;
    }),
  );

  const observationEndsAt = Date.now() + 10 * 60 * 1_000;
  while (Date.now() < observationEndsAt) {
    for (const page of pages) {
      await expect(page.getByRole("status")).toContainText("Response started");
      await expect(page.getByRole("button", { name: "Stop response" })).toBeEnabled();
      await expect(page.locator("[data-assistant-model-selector] summary")).toBeVisible();
    }
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }

  await Promise.all(pages.map(async (page) => {
    await page.getByRole("button", { name: "Stop response" }).click();
    await expect(page.getByText("Stopped", { exact: true })).toBeVisible();
    await expect(page.getByText("Still cooking locally.", { exact: true })).toBeVisible();
  }));
  await context.close();
});
