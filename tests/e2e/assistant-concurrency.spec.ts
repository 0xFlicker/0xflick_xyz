import { expect, test } from "@playwright/test";

test("two pages converge queued turns through one session lock", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = 10;
      contextWindow = 1_000;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(20); }
      promptStreaming(input: Array<{ content: string }>) {
        const prompt = input.at(-1)?.content ?? "unknown";
        return new ReadableStream<string>({
          async start(controller) {
            await new Promise((resolve) => setTimeout(resolve, 40));
            controller.enqueue(`Answer for ${prompt}`);
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  const first = await context.newPage();
  await first.goto("/assistant");
  await first.getByLabel("Message the local assistant").fill("Seed session");
  await first.getByRole("button", { name: "Send message" }).click();
  await expect(first.getByText("Answer for Seed session", { exact: true })).toBeVisible();

  const second = await context.newPage();
  await second.goto("/assistant");
  await expect(second.getByText("Answer for Seed session", { exact: true })).toBeVisible();
  await Promise.all([
    first.getByLabel("Message the local assistant").fill("Turn from first"),
    second.getByLabel("Message the local assistant").fill("Turn from second"),
  ]);
  await Promise.all([
    first.getByRole("button", { name: "Send message" }).click(),
    second.getByRole("button", { name: "Send message" }).click(),
  ]);

  for (const page of [first, second]) {
    await expect(page.getByText("Answer for Turn from first", { exact: true })).toHaveCount(1);
    await expect(page.getByText("Answer for Turn from second", { exact: true })).toHaveCount(1);
  }
  await context.close();
});

test("a queued page explicitly releases an orphaned generation after the lock owner closes", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = 10;
      contextWindow = 1_000;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(20); }
      promptStreaming(input: Array<{ content: string }>) {
        const prompt = input.at(-1)?.content ?? "unknown";
        return new ReadableStream<string>({
          start(controller) {
            if (prompt === "First slow turn") {
              controller.enqueue("Orphaned partial");
              return;
            }
            controller.enqueue(`Recovered answer for ${prompt}`);
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  const owner = await context.newPage();
  await owner.goto("/assistant");
  await owner.getByLabel("Message the local assistant").fill("Seed");
  await owner.getByRole("button", { name: "Send message" }).click();
  await expect(owner.getByText("Recovered answer for Seed", { exact: true })).toBeVisible();

  const waiting = await context.newPage();
  await waiting.goto("/assistant");
  await owner.getByLabel("Message the local assistant").fill("First slow turn");
  await owner.getByRole("button", { name: "Send message" }).click();
  await expect(owner.getByText("Orphaned partial")).toBeVisible();
  await waiting.getByLabel("Message the local assistant").fill("Queued recovery turn");
  await waiting.getByRole("button", { name: "Send message" }).click();
  await owner.close();

  await waiting.getByRole("button", { name: "Release stalled response" }).first().click();
  await expect(waiting.getByText("Recovered answer for Queued recovery turn", { exact: true })).toBeVisible();
  await expect(waiting.getByText("Stopped")).toBeVisible();
  await context.close();
});

test("deletion during generation prevents stale checkpoints from recreating the chat", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = 10;
      contextWindow = 1_000;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(20); }
      promptStreaming(input: Array<{ content: string }>) {
        const prompt = input.at(-1)?.content ?? "unknown";
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue(prompt === "Delete during this" ? "Stale partial" : "Seed answer");
            if (prompt !== "Delete during this") controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  const generating = await context.newPage();
  await generating.goto("/assistant");
  await generating.getByLabel("Message the local assistant").fill("Race session");
  await generating.getByRole("button", { name: "Send message" }).click();
  await expect(generating.getByText("Seed answer", { exact: true })).toBeVisible();

  const deleting = await context.newPage();
  await deleting.goto("/assistant");
  await generating.getByLabel("Message the local assistant").fill("Delete during this");
  await generating.getByRole("button", { name: "Send message" }).click();
  await expect(generating.getByText("Stale partial")).toBeVisible();
  const chats = deleting.getByRole("button", { name: "Chats", exact: true });
  if (await chats.isVisible()) await chats.click();
  await deleting.getByRole("button", { name: "Delete Race session" }).click();
  await deleting.getByRole("button", { name: "Delete chat" }).click();
  await expect(deleting.getByText("Think here, on this device.")).toBeVisible();
  await generating.close();
  await deleting.reload();
  await expect(deleting.getByRole("button", { name: "Race session" })).toHaveCount(0);
  await context.close();
});
