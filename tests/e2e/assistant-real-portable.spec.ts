import { expect, test, type Page } from "@playwright/test";

type RealTier = "wasm" | "webgpu";

const requestedTier = process.env.ASSISTANT_REAL_PORTABLE as RealTier | undefined;

const tiers: Record<RealTier, {
  displayName: string;
  executionName: string;
}> = {
  wasm: {
    displayName: "SmolLM2 135M",
    executionName: "WASM",
  },
  webgpu: {
    displayName: "SmolLM2 360M",
    executionName: "WebGPU",
  },
};

async function chooseTier(page: Page, tier: RealTier): Promise<void> {
  await page.locator("[data-assistant-model-selector] summary").click();
  await page.getByRole("button", { name: new RegExp(tiers[tier].displayName) }).click();
}

async function prepareTier(page: Page, tier: RealTier): Promise<boolean> {
  await chooseTier(page, tier);
  await expect(
    page.getByRole("heading", { name: `Prepare ${tiers[tier].displayName}?` }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Download and prepare" }).click();
  return Promise.race([
    page.getByLabel("Message the local assistant").waitFor({
      state: "visible",
      timeout: 0,
    }).then(() => true),
    page.getByText("This model could not become ready on this device.").waitFor({
      state: "visible",
      timeout: 0,
    }).then(() => false),
  ]);
}

for (const tier of ["wasm", "webgpu"] as const) {
  test(`real ${tiers[tier].displayName} ${tiers[tier].executionName} readiness journey`, async ({ page }) => {
    test.skip(
      requestedTier !== tier,
      `Set ASSISTANT_REAL_PORTABLE=${tier} to run this owner-controlled acceptance journey.`,
    );
    test.setTimeout(0);

    const requests: Array<{ range: string | null; url: string }> = [];
    page.on("request", (request) => requests.push({
      range: request.headers().range ?? null,
      url: request.url(),
    }));
    await page.goto("/assistant");
    const ready = await prepareTier(page, tier);
    if (!ready) {
      expect(tier).toBe("webgpu");
      await expect(page.getByLabel("Message the local assistant")).toHaveCount(0);
      await expect(page.getByRole("separator")).toHaveCount(0);
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.locator("[data-assistant-model-selector] summary").click();
      await expect(page.getByRole("button", { name: /SmolLM2 135M/ })).toBeEnabled();
      return;
    }

    const canary = `real-${tier}-private-${Date.now()}`;
    const requestCountBeforeInference = requests.length;
    await page.getByLabel("Message the local assistant").fill(canary);
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByRole("status").filter({ hasText: "Response complete" }).waitFor({
      state: "visible",
      timeout: 0,
    });
    const firstTurn = page.getByLabel("Conversation transcript").getByRole("article").last();
    const firstTurnText = await firstTurn.textContent();
    expect(firstTurnText).toContain(canary);
    expect(firstTurnText?.replace(canary, "").replace("Copy response", "").trim()).not.toBe("");
    expect(requests.slice(requestCountBeforeInference)).toEqual([]);
    expect(requests.map((request) => request.url).join("\n")).not.toContain(canary);

    await page.getByLabel("Message the local assistant").fill(
      "Write a long local stream with many distinct short sentences so I can stop it after output begins.",
    );
    await page.getByRole("button", { name: "Send message" }).click();
    await page.getByRole("status").filter({ hasText: "Response started" }).waitFor({
      state: "visible",
      timeout: 0,
    });
    await page.getByRole("button", { name: "Stop response" }).click();
    await expect(
      page.getByLabel("Conversation transcript").getByText("Stopped", { exact: true }),
    ).toBeVisible({ timeout: 0 });

    await page.reload();
    const requestCountBeforeCacheReuse = requests.length;
    expect(await prepareTier(page, tier)).toBe(true);
    const cacheReuseRequests = requests.slice(requestCountBeforeCacheReuse);
    expect(
      cacheReuseRequests.filter(
        (request) =>
          /\/resolve\/.*\/onnx\/.*\.onnx(?:$|\?)/.test(request.url) &&
          request.range !== "bytes=0-0",
      ),
    ).toEqual([]);

    await page.locator("[data-assistant-model-selector] summary").click();
    await page.getByRole("button", { name: "Manage downloaded models" }).click();
    const modelSection = page
      .getByRole("dialog", { name: "Downloaded models" })
      .locator("section")
      .filter({ hasText: tiers[tier].displayName });
    await modelSection.getByRole("button", { name: "Remove" }).click();
    await page.getByRole("button", { name: "Remove model" }).click();
    await expect(modelSection.getByText("Not installed", { exact: true })).toBeVisible({
      timeout: 0,
    });
    await expect(
      page.getByLabel("Conversation transcript").getByText(canary, { exact: true }),
    ).toBeVisible();
  });
}
