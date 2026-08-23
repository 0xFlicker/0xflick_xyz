import { expect, test, type Page } from "@playwright/test";

import { installThreeModelProfile } from "./helpers/modelProfile";

const canary = "portable-private-canary-93f7";

async function installFakePortable(
  page: Page,
  generationDelay = 30,
  partialText: string | null = null,
): Promise<void> {
  await page.addInitScript(({ generationDelay, partialText }) => {
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: undefined });
    const runtimeIdentity = "smollm2-135m-wasm:b8a5c0f183b78c55955a5364f610c36668b5e681:wasm:q4:1";
    window.__FLICK_ASSISTANT_PORTABLE_WORKER_FACTORY__ = () => {
      let handler: ((event: MessageEvent) => void) | null = null;
      let interrupted = false;
      const emit = (data: object) => handler?.({ data } as MessageEvent);
      return {
        get onmessage() { return handler; },
        set onmessage(value) { handler = value; },
        postMessage(command: { attemptId: string; kind: string }) {
          const base = { protocolVersion: 1, attemptId: command.attemptId, runtimeIdentity };
          if (command.kind === "prepare") {
            queueMicrotask(() => emit({
              ...base,
              kind: "progress",
              stage: "loading",
              progress: null,
              loaded: null,
              total: null,
            }));
            queueMicrotask(() => emit({ ...base, kind: "ready", contextLimit: 8192 }));
          } else if (command.kind === "healthCheck") {
            queueMicrotask(() => emit({ ...base, kind: "complete", text: "ready", interrupted: false }));
          } else if (command.kind === "measure") {
            queueMicrotask(() => emit({ ...base, kind: "measurement", used: 24, capacity: 8192 }));
          } else if (command.kind === "generate") {
            interrupted = false;
            if (partialText) {
              window.setTimeout(() => {
                if (!interrupted) emit({ ...base, kind: "delta", text: partialText });
              }, 5);
            }
            window.setTimeout(() => {
              if (interrupted) return;
              emit({ ...base, kind: "delta", text: "Private portable response." });
              emit({ ...base, kind: "complete", text: "Private portable response.", interrupted: false });
            }, generationDelay);
          } else if (command.kind === "interrupt") {
            interrupted = true;
            queueMicrotask(() => emit({ ...base, kind: "interrupted", text: "Private portable" }));
          } else if (command.kind === "dispose") {
            queueMicrotask(() => emit({ ...base, kind: "disposed" }));
          }
        },
        terminate() { interrupted = true; },
      };
    };
  }, { generationDelay, partialText });
}

async function chooseCompatibilityModel(page: Page): Promise<void> {
  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /SmolLM2 135M/ }).click();
}

test("fake portable model prepares with consent and answers without content egress", async ({ page }) => {
  const requests: string[] = [];
  const logs: string[] = [];
  page.on("request", (request) => {
    requests.push(`${request.url()}\n${JSON.stringify(request.headers())}\n${request.postData() ?? ""}`);
  });
  page.on("console", (message) => logs.push(message.text()));
  await installFakePortable(page);
  await page.goto("/assistant");

  await chooseCompatibilityModel(page);
  await expect(page.getByText(/SmolLM2 135M · WASM/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepare SmolLM2 135M?" })).toBeVisible();
  await page.getByRole("button", { name: "Download and prepare" }).click();
  const composer = page.getByLabel("Message the local assistant");
  await expect(composer).toBeVisible();
  const requestCountBeforeInference = requests.length;
  await composer.fill(canary);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Private portable response.", { exact: true })).toBeVisible();

  expect(requests.slice(requestCountBeforeInference)).toEqual([]);
  expect(requests.join("\n")).not.toContain(canary);
  expect(requests.join("\n")).not.toContain("Private portable response");
  expect(logs.join("\n")).not.toContain(canary);
  expect(logs.join("\n")).not.toContain("Private portable response");
});

test("portable work has no application timeout and stop preserves partial output", async ({ page }) => {
  await installFakePortable(page, 5_000, "Partial local output");
  await page.goto("/assistant");
  await chooseCompatibilityModel(page);
  await page.getByRole("button", { name: "Download and prepare" }).click();
  await page.getByLabel("Message the local assistant").fill("Keep cooking locally");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Partial local output", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Stop response" }).click();
  await expect(page.getByText("Stopped", { exact: true })).toBeVisible();
  await expect(page.getByText("Partial local output", { exact: true })).toBeVisible();
});

test("unavailable-all-models keeps the local-only takeover", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: undefined });
    Object.defineProperty(globalThis, "Worker", { configurable: true, value: undefined });
  });
  await page.goto("/assistant");
  await expect(page.getByRole("heading", { name: /No local model can be offered here/i })).toBeVisible();
  await expect(page.getByLabel("Message the local assistant")).toHaveCount(0);
});

test("twenty turns across both portable tiers keep conversation canaries out of requests", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  const page = await context.newPage();
  const requests: string[] = [];
  const logs: string[] = [];
  page.on("request", (request) => {
    requests.push(`${request.url()}\n${JSON.stringify(request.headers())}\n${request.postData() ?? ""}`);
  });
  page.on("console", (message) => logs.push(message.text()));
  await page.goto("/assistant");

  const tiers = [
    { name: /SmolLM2 360M/, responseOffset: 0 },
    { name: /SmolLM2 135M/, responseOffset: 10 },
  ];
  const canaries: string[] = [];
  for (const tier of tiers) {
    await page.locator("[data-assistant-model-selector] summary").click();
    await page.getByRole("button", { name: tier.name }).click();
    await page.getByRole("button", { name: "Download and prepare" }).click();
    await expect(page.getByLabel("Message the local assistant")).toBeEnabled();
    for (let index = 0; index < 10; index += 1) {
      const canaryValue = `portable-tier-private-${tier.responseOffset + index}`;
      canaries.push(canaryValue);
      await page.getByLabel("Message the local assistant").fill(canaryValue);
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(
        page.getByLabel("Conversation transcript").getByText(canaryValue, { exact: true }),
      ).toHaveCount(1);
      await expect(page.getByText("Portable local response.", { exact: true })).toHaveCount(
        tier.responseOffset + index + 1,
      );
    }
  }

  const requestText = requests.join("\n");
  const logText = logs.join("\n");
  for (const canaryValue of canaries) expect(requestText).not.toContain(canaryValue);
  for (const canaryValue of canaries) expect(logText).not.toContain(canaryValue);
  expect(requestText).not.toContain("Portable local response.");
  expect(logText).not.toContain("Portable local response.");
  await context.close();
});
