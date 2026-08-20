import { describe, expect, it } from "vitest";

import { ResilientAssistantRepository } from "@/features/assistant/storage/repositoryFallback";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import type { AssistantRepository } from "@/features/assistant/storage/repository";
import { toSubmissionId } from "@/features/assistant/types";

function delegate(memory: MemoryAssistantRepository): AssistantRepository {
  return {
    acceptPrompt: memory.acceptPrompt.bind(memory),
    checkpointResponse: memory.checkpointResponse.bind(memory),
    claimNextTurn: memory.claimNextTurn.bind(memory),
    clearAll: memory.clearAll.bind(memory),
    commitContext: memory.commitContext.bind(memory),
    deleteSession: memory.deleteSession.bind(memory),
    destroy: memory.destroy.bind(memory),
    finishTurn: memory.finishTurn.bind(memory),
    getConversation: memory.getConversation.bind(memory),
    getSessions: memory.getSessions.bind(memory),
    getSettings: memory.getSettings.bind(memory),
    initialize: memory.initialize.bind(memory),
    mode: () => "durable",
    savePersonality: memory.savePersonality.bind(memory),
    selectSession: memory.selectSession.bind(memory),
    subscribeConversation: memory.subscribeConversation.bind(memory),
    subscribeSessions: memory.subscribeSessions.bind(memory),
    subscribeSettings: memory.subscribeSettings.bind(memory),
  };
}

function unavailableRepository(): AssistantRepository {
  const repository = delegate(new MemoryAssistantRepository());
  return {
    ...repository,
    initialize: async () => {
      throw new DOMException("IndexedDB unavailable", "InvalidStateError");
    },
  };
}

describe("ResilientAssistantRepository", () => {
  it("falls back once to page-lifetime storage after an initialization failure", async () => {
    const repository = new ResilientAssistantRepository(
      unavailableRepository(),
      new MemoryAssistantRepository(),
    );
    const initial = await repository.initialize();
    expect(repository.mode()).toBe("temporary");
    expect(initial.sessions.sessions).toEqual([]);

    await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("temporary"),
      text: "Only in this page",
    });
    expect((await repository.getSessions()).sessions[0].title).toBe("Only in this page");
  });

  it("hydrates a coherent snapshot and rebinds subscribers after a mid-write failure", async () => {
    const durableMemory = new MemoryAssistantRepository();
    await durableMemory.initialize();
    await durableMemory.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("durable"),
      text: "Already durable",
    });
    const durable = delegate(durableMemory);
    let failNextWrite = true;
    durable.acceptPrompt = async (input) => {
      if (failNextWrite) {
        failNextWrite = false;
        throw new DOMException("Quota unavailable", "QuotaExceededError");
      }
      return durableMemory.acceptPrompt(input);
    };
    const repository = new ResilientAssistantRepository(
      durable,
      new MemoryAssistantRepository(),
    );
    await repository.initialize();
    const observedCounts: number[] = [];
    const unsubscribe = repository.subscribeSessions((snapshot) => {
      observedCounts.push(snapshot.sessions.length);
    });

    await repository.acceptPrompt({
      at: 2,
      sessionId: null,
      submissionId: toSubmissionId("temporary"),
      text: "Continues temporarily",
    });

    expect(repository.mode()).toBe("temporary");
    expect((await repository.getSessions()).sessions.map((session) => session.title)).toEqual([
      "Continues temporarily",
      "Already durable",
    ]);
    expect(observedCounts.at(-1)).toBe(2);
    unsubscribe();
  });

  it("does not claim a destructive write succeeded after persistence fails", async () => {
    const durableMemory = new MemoryAssistantRepository();
    await durableMemory.initialize();
    const accepted = await durableMemory.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("kept"),
      text: "Deletion must be verified",
    });
    const durable = delegate(durableMemory);
    durable.deleteSession = async () => ({ ok: false, code: "deletion_unverified" });
    const repository = new ResilientAssistantRepository(
      durable,
      new MemoryAssistantRepository(),
    );
    await repository.initialize();

    await expect(repository.deleteSession(accepted.sessionId, 2)).resolves.toEqual({
      ok: false,
      code: "deletion_unverified",
    });
    expect(repository.mode()).toBe("temporary");
    expect(await repository.getConversation(accepted.sessionId)).not.toBeNull();
  });
});
