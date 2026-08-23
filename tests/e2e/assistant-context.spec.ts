import { expect, test } from "@playwright/test";

test("shows measured context and preserves transcript through context inspection", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = 76;
      contextWindow = 100;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(4); }
      promptStreaming() {
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Context-aware answer");
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Keep this visible");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Context-aware answer", { exact: true })).toBeVisible();
  await expect(page.getByText("Nearing context limit")).toBeVisible();
  await page.getByRole("button", { name: "Context details" }).click();
  await expect(
    page.getByLabel("Conversation transcript").getByText("Keep this visible"),
  ).toBeVisible();
});

test("manually compacts older turns without changing or losing the transcript", async ({ page }) => {
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
        const output = this.summary ? "Critical fact: cedar remains selected." : "Local reply.";
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue(output);
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  await page.goto("/assistant");
  for (let index = 1; index <= 5; index += 1) {
    await page.getByLabel("Message the local assistant").fill(`Visible turn ${index}`);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByLabel("Conversation transcript").getByText("Local reply."),
    ).toHaveCount(index);
  }
  await page.getByRole("button", { name: "Context details" }).click();
  await page.getByRole("button", { name: "Compact now" }).click();
  await expect(page.getByText("Compacted")).toBeVisible();
  for (let index = 1; index <= 5; index += 1) {
    await expect(
      page.getByLabel("Conversation transcript").getByText(`Visible turn ${index}`),
    ).toBeVisible();
  }
  await page.reload();
  await page.getByRole("button", { name: "Context details" }).click();
  await page.getByText("See condensed summary").click();
  await expect(page.getByText(/cedar remains selected/i)).toBeVisible();
});

test("automatically compacts at projected 80% and retains the recent direct turns", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "__summaryCreates", { configurable: true, value: 0, writable: true });
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create(options: { initialPrompts?: Array<{ content: string }> } = {}) {
        const summary = options.initialPrompts?.[0]?.content.includes("Condense") ?? false;
        if (summary) {
          const count = Reflect.get(globalThis, "__summaryCreates");
          Reflect.set(globalThis, "__summaryCreates", typeof count === "number" ? count + 1 : 1);
        }
        return Promise.resolve(new FakeLanguageModel(summary));
      }
      contextUsage = 76;
      contextWindow = 100;
      constructor(private readonly summary: boolean) {}
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(4); }
      promptStreaming() {
        if (this.summary) {
          return new ReadableStream<string>({
            start(controller) {
              Reflect.set(globalThis, "__finishSummary", () => {
                controller.enqueue("Automatic summary retained fact amber.");
                controller.close();
              });
            },
          });
        }
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Automatic local reply.");
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  await page.goto("/assistant");
  for (let index = 1; index <= 2; index += 1) {
    await page.getByLabel("Message the local assistant").fill(`Automatic turn ${index}`);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByLabel("Conversation transcript").getByText("Automatic local reply."),
    ).toHaveCount(index);
  }

  await page.getByLabel("Message the local assistant").fill("Automatic turn 3");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Making room for this conversation…")).toBeVisible();
  await expect(page.getByText("Your message will start automatically.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByLabel("Message the local assistant")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Stop response" })).toHaveCount(0);
  await page.evaluate(() => {
    const finishSummary = Reflect.get(globalThis, "__finishSummary");
    if (typeof finishSummary !== "function") throw new Error("Summary is not waiting");
    finishSummary();
  });
  await expect(
    page.getByLabel("Conversation transcript").getByText("Automatic local reply."),
  ).toHaveCount(3);
  expect(await page.evaluate(() => Reflect.get(globalThis, "__summaryCreates"))).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Context details" }).click();
  await page.getByText("See condensed summary").click();
  await expect(page.getByText(/Automatic summary retained fact amber/i)).toBeVisible();
  for (let index = 1; index <= 3; index += 1) {
    await expect(
      page.getByLabel("Conversation transcript").getByText(`Automatic turn ${index}`),
    ).toBeVisible();
  }
});

test("reports unknown capacity and blocks the next turn after browser overflow", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = Number.NaN;
      contextWindow = Number.NaN;
      private readonly listeners = new Set<() => void>();
      addEventListener(name: string, listener: () => void) {
        if (name === "contextoverflow") this.listeners.add(listener);
      }
      removeEventListener(name: string, listener: () => void) {
        if (name === "contextoverflow") this.listeners.delete(listener);
      }
      destroy() {}
      measureContextUsage() { return Promise.resolve(Number.NaN); }
      promptStreaming() {
        const listeners = this.listeners;
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Overflowing answer");
            listeners.forEach((listener) => listener());
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  await page.goto("/assistant");
  await expect(page.getByRole("button", { name: "Context details" })).toHaveCount(0);
  await page.getByLabel("Message the local assistant").fill("Overflow this turn");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Context overflowed")).toBeVisible();
  await page.getByLabel("Message the local assistant").fill("Must be blocked");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/generation did not proceed with verified full context/i)).toBeVisible();
});
