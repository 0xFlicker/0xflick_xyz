import { expect, test } from "@playwright/test";

import { installThreeModelProfile } from "./helpers/modelProfile";

test("lists strongest-first models and transfers portable assets only after confirmation", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  const page = await context.newPage();
  await page.goto("/assistant");

  await expect(page.locator("[data-assistant-model-selector] summary")).toContainText(
    "Built-in browser model · Prompt API",
  );
  await page.locator("[data-assistant-model-selector] summary").click();
  const modelButtons = page.locator("[data-assistant-model-selector] button");
  await expect(modelButtons.nth(0)).toContainText("Built-in browser model");
  await expect(modelButtons.nth(1)).toContainText("SmolLM2 360M");
  await expect(modelButtons.nth(2)).toContainText("SmolLM2 135M");
  expect(await page.evaluate(() => window.__portableWorkerCreations)).toBe(0);

  await page.keyboard.press("Escape");
  await page.getByLabel("Message the local assistant").fill("Create a durable native turn");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Native local response.", { exact: true })).toBeVisible();

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /SmolLM2 135M/ }).click();
  await expect(page.getByText(/Switching to a less performant model may reduce answer quality and conversation memory/)).toBeVisible();
  expect(await page.evaluate(() => window.__portableWorkerCreations)).toBe(0);
  await page.getByRole("button", { name: "Download and prepare" }).click();
  await expect(page.getByRole("separator")).toHaveText("Switched to SmolLM2 135M · WASM");
  expect(await page.evaluate(() => window.__portableWorkerCreations)).toBeGreaterThan(0);
  await expect(page.getByText(/model:/i)).toHaveCount(0);

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /Built-in browser model/ }).click();
  await page.getByRole("button", { name: "Switch model" }).click();
  await expect(page.getByRole("separator")).toHaveCount(2);
  await expect(page.getByRole("separator").last()).toHaveText(
    "Switched to Built-in browser model · Prompt API",
  );
  await context.close();
});

test("failed portable readiness keeps the prior active model and writes no boundary", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  const page = await context.newPage();
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Keep native active");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Native local response.", { exact: true })).toBeVisible();
  await page.evaluate(() => { window.__portableReadinessFailure = true; });

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /SmolLM2 360M/ }).click();
  await page.getByRole("button", { name: "Download and prepare" }).click();
  await expect(page.getByText(/could not become ready/)).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator("[data-assistant-model-selector] summary")).toContainText(
    "Built-in browser model · Prompt API",
  );
  await expect(page.getByRole("separator")).toHaveCount(0);
  await expect(page.getByLabel("Message the local assistant")).toBeEnabled();
  await context.close();
});

test("latest confirmed model wins across windows without Web Locks or prompt replay", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  });
  const first = await context.newPage();
  await first.goto("/assistant");
  await first.getByLabel("Message the local assistant").fill("One immutable seed turn");
  await first.getByRole("button", { name: "Send message" }).click();
  await expect(first.getByText("Native local response.", { exact: true })).toBeVisible();

  const second = await context.newPage();
  await second.goto("/assistant");
  await expect(
    second.getByLabel("Conversation transcript").getByText("One immutable seed turn", { exact: true }),
  ).toBeVisible();

  await first.evaluate(() => {
    window.__portablePreparationDelay[
      "smollm2-360m-webgpu:fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9:webgpu:q4:1"
    ] = 250;
  });
  await first.locator("[data-assistant-model-selector] summary").click();
  await first.getByRole("button", { name: /SmolLM2 360M/ }).click();
  await first.getByRole("button", { name: "Download and prepare" }).click();

  await second.locator("[data-assistant-model-selector] summary").click();
  await second.getByRole("button", { name: /SmolLM2 135M/ }).click();
  await second.getByRole("button", { name: "Download and prepare" }).click();

  for (const page of [first, second]) {
    await expect(page.getByRole("separator")).toHaveCount(1);
    await expect(page.getByRole("separator")).toHaveText("Switched to SmolLM2 135M · WASM");
    await expect(page.locator("[data-assistant-model-selector] summary")).toContainText(
      "SmolLM2 135M · WASM",
    );
    await expect(
      page.getByLabel("Conversation transcript").getByText("One immutable seed turn", { exact: true }),
    ).toHaveCount(1);
    await expect(page.getByText("Native local response.", { exact: true })).toHaveCount(1);
  }
  await expect(first.getByRole("dialog")).toHaveCount(0);
  await expect(first.getByRole("status")).not.toContainText("Response failed");
  await context.close();
});

test("reopening a chat uses one already-ready fallback and leaves downloadable-only models inactive", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  const page = await context.newPage();
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Fallback chat");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Native local response.", { exact: true })).toBeVisible();

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /SmolLM2 135M/ }).click();
  await page.getByRole("button", { name: "Download and prepare" }).click();
  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /Built-in browser model/ }).click();
  await page.getByRole("button", { name: "Switch model" }).click();

  const chats = page.getByRole("button", { name: "Chats", exact: true });
  if (await chats.isVisible()) await chats.click();
  await page.getByRole("button", { name: "New chat" }).click();
  await page.getByLabel("Message the local assistant").fill("Other chat");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Native local response.", { exact: true }).last()).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: undefined });
  });
  if (await chats.isVisible()) await chats.click();
  await page.getByRole("button", { name: "Fallback chat", exact: true }).click();
  await expect(page.locator("[data-assistant-model-selector] summary")).toContainText(
    "SmolLM2 135M · WASM",
  );
  await expect(page.getByRole("separator").last()).toHaveText(
    "Switched to SmolLM2 135M · WASM",
  );

  await context.close();

  const downloadableContext = await browser.newContext();
  await installThreeModelProfile(downloadableContext);
  await downloadableContext.addInitScript(() => {
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "gpu", { configurable: true, value: undefined });
  });
  const downloadable = await downloadableContext.newPage();
  await downloadable.goto("/assistant");
  await downloadable.locator("[data-assistant-model-selector] summary").click();
  await downloadable.getByRole("button", { name: /SmolLM2 135M/ }).click();
  await downloadable.getByRole("button", { name: "Download and prepare" }).click();
  await downloadable.getByLabel("Message the local assistant").fill("Portable reopen chat");
  await downloadable.getByRole("button", { name: "Send message" }).click();
  await expect(downloadable.getByText("Portable local response.", { exact: true })).toBeVisible();
  await downloadable.reload();
  await expect(downloadable.getByRole("heading", { name: "Prepare SmolLM2 135M" })).toBeVisible();
  await expect(downloadable.getByLabel("Message the local assistant")).toHaveCount(0);
  expect(await downloadable.evaluate(() => window.__portableWorkerCreations)).toBe(0);
  await expect(downloadable.getByRole("separator")).toHaveCount(0);
  await downloadableContext.close();
});
