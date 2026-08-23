import { expect, test } from "@playwright/test";

async function installReadyModel(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = 10;
      contextWindow = 1_000;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(20); }
      promptStreaming() {
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Persisted local answer");
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
}

async function openChatsIfNeeded(page: import("@playwright/test").Page) {
  const chatsButton = page.getByRole("button", { name: "Chats", exact: true });
  if (await chatsButton.isVisible()) await chatsButton.click();
}

test("persists, reloads, deletes one chat, and clears all browser-local history", async ({ page }) => {
  await installReadyModel(page);
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Durable session");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Persisted local answer", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Persisted local answer", { exact: true })).toBeVisible();

  await openChatsIfNeeded(page);
  await page.getByRole("button", { name: "New chat" }).click();
  await page.getByLabel("Message the local assistant").fill("Second durable session");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator("header").getByText("Second durable session")).toBeVisible();
  await expect(
    page.getByLabel("Conversation transcript").getByText("Persisted local answer"),
  ).toBeVisible();

  await openChatsIfNeeded(page);
  await page.getByRole("button", { name: "Delete Second durable session" }).click();
  await expect(page.getByRole("dialog", { name: /delete second durable session/i })).toBeVisible();
  await page.getByRole("button", { name: "Delete chat" }).click();
  await expect(page.getByText("Persisted local answer", { exact: true })).toBeVisible();

  await openChatsIfNeeded(page);
  await page.getByRole("button", { name: "Clear all chats" }).click();
  await page.getByRole("button", { name: "Clear everything" }).click();
  await expect(page.getByText("Think here, on this device.")).toBeVisible();
});

test("blocks the 101st saved chat until one is deleted", async ({ page }) => {
  await installReadyModel(page);
  await page.goto("/assistant");
  await page.getByLabel("Message the local assistant").fill("Seed session");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("status")).toContainText("Response complete");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("flick-assistant");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("sessions", "readwrite");
        const store = transaction.objectStore("sessions");
        for (let index = 1; index < 100; index += 1) {
          store.put({
            id: `seed-${index}`,
            epoch: 0,
            title: `Seed ${index}`,
            titleSourceTurnId: `seed-turn-${index}`,
            createdAt: index,
            updatedAt: index,
            historyRevision: 0,
          });
        }
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.reload();
  await openChatsIfNeeded(page);
  await expect(page.getByRole("button", { name: "New chat" })).toBeDisabled();
  await expect(page.locator("p:visible").filter({ hasText: "100 chats saved" })).toBeVisible();
  await page.getByRole("button", { name: "Delete Seed session" }).click();
  await page.getByRole("button", { name: "Delete chat" }).click();
  await openChatsIfNeeded(page);
  await expect(page.getByRole("button", { name: "New chat" })).toBeEnabled();
});

test("falls back visibly to page-lifetime history when IndexedDB cannot open", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      get() {
        throw new DOMException("Unavailable", "InvalidStateError");
      },
    });
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
            controller.enqueue("Temporary answer");
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", { configurable: true, value: FakeLanguageModel });
  });
  await page.goto("/assistant");
  await expect(page.getByRole("status")).toContainText("Not saved");
  await page.getByLabel("Message the local assistant").fill("Temporary prompt");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Temporary answer", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Temporary answer")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Not saved");
});
