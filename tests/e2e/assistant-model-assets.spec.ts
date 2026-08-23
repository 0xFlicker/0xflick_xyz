import { expect, test } from "@playwright/test";

import { installThreeModelProfile } from "./helpers/modelProfile";

async function openChatsIfNeeded(page: import("@playwright/test").Page): Promise<void> {
  const chats = page.getByRole("button", { name: "Chats", exact: true });
  if (await chats.isVisible()) await chats.click();
}

test("Clear all preserves a ready model while active removal preserves the chat and blocks sending", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  const page = await context.newPage();
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Before portable switch");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Native local response.", { exact: true })).toBeVisible();

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /SmolLM2 135M/ }).click();
  await page.getByRole("button", { name: "Download and prepare" }).click();
  await expect(page.getByLabel("Message the local assistant")).toBeEnabled();

  await openChatsIfNeeded(page);
  await page.getByRole("button", { name: "Clear all chats" }).click();
  await expect(page.getByText(/Downloaded local models stay installed/)).toBeVisible();
  await page.getByRole("button", { name: "Clear everything" }).click();
  await expect(page.getByText("Think here, on this device.")).toBeVisible();
  await expect(page.locator("[data-assistant-model-selector] summary")).toContainText(
    "SmolLM2 135M · WASM",
  );
  await expect(page.getByLabel("Message the local assistant")).toBeEnabled();

  await page.getByLabel("Message the local assistant").fill("Chat survives model removal");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Portable local response.", { exact: true })).toBeVisible();

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: "Manage downloaded models" }).click();
  await expect(page.getByRole("dialog", { name: "Downloaded models" })).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).last().click();
  await expect(page.getByText(/Chats and model boundaries remain/)).toBeVisible();
  await page.getByRole("button", { name: "Remove model" }).click();
  await expect(page.getByText("Not installed", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await expect(
    page.getByLabel("Conversation transcript").getByText("Chat survives model removal", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Portable local response.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose a model to continue" })).toBeVisible();
  await expect(page.getByLabel("Message the local assistant")).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Choose a model to continue" })).toBeVisible();
  await expect(page.locator("[data-assistant-model-selector] summary")).toContainText(
    "SmolLM2 135M · WASM",
  );
  await expect(page.getByLabel("Message the local assistant")).toHaveCount(0);

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /Built-in browser model/ }).click();
  await page.getByRole("button", { name: "Switch model" }).click();
  await expect(page.getByLabel("Message the local assistant")).toBeEnabled();
  await context.close();
});

test("model removal invalidates another open page without selecting a replacement", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  const first = await context.newPage();
  await first.goto("/assistant");
  await first.getByLabel("Message the local assistant").fill("Shared active model");
  await first.getByRole("button", { name: "Send message" }).click();
  await expect(first.getByText("Native local response.", { exact: true })).toBeVisible();
  await first.locator("[data-assistant-model-selector] summary").click();
  await first.getByRole("button", { name: /SmolLM2 135M/ }).click();
  await first.getByRole("button", { name: "Download and prepare" }).click();

  const second = await context.newPage();
  await second.goto("/assistant");
  await second.locator("[data-assistant-model-selector] summary").click();
  await second.getByRole("button", { name: /SmolLM2 135M/ }).click();
  await second.getByRole("button", { name: "Download and prepare" }).click();
  await expect(second.getByLabel("Message the local assistant")).toBeEnabled();

  await first.locator("[data-assistant-model-selector] summary").click();
  await first.getByRole("button", { name: "Manage downloaded models" }).click();
  await first.getByRole("button", { name: "Remove" }).last().click();
  await first.getByRole("button", { name: "Remove model" }).click();
  await first.getByRole("button", { name: "Close" }).click();

  await expect(second.getByRole("heading", { name: "Choose a model to continue" })).toBeVisible();
  await expect(second.getByLabel("Message the local assistant")).toHaveCount(0);
  await expect(second.locator("[data-assistant-model-selector] summary")).toContainText(
    "SmolLM2 135M · WASM",
  );
  await context.close();
});

test("removing an inactive model leaves the active model and transcript untouched", async ({ browser }) => {
  const context = await browser.newContext();
  await installThreeModelProfile(context);
  const page = await context.newPage();
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Inactive removal transcript");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Native local response.", { exact: true })).toBeVisible();

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /SmolLM2 360M/ }).click();
  await page.getByRole("button", { name: "Download and prepare" }).click();
  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: /Built-in browser model/ }).click();
  await page.getByRole("button", { name: "Switch model" }).click();

  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: "Manage downloaded models" }).click();
  const modelSection = page
    .getByRole("dialog", { name: "Downloaded models" })
    .locator("section")
    .filter({ hasText: "SmolLM2 360M" });
  await modelSection.getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Remove model" }).click();
  await expect(modelSection.getByText("Not installed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.locator("[data-assistant-model-selector] summary")).toContainText(
    "Built-in browser model · Prompt API",
  );
  await expect(page.getByLabel("Message the local assistant")).toBeEnabled();
  await expect(
    page.getByLabel("Conversation transcript").getByText("Inactive removal transcript", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Native local response.", { exact: true })).toBeVisible();
  await context.close();
});
