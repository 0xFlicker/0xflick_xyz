import { describe, expect, it } from "vitest";

import { compactConversation } from "@/features/assistant/context/compaction";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { toAttemptId, toSubmissionId } from "@/features/assistant/types";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

async function completedConversation(repository: MemoryAssistantRepository) {
  let sessionId = null;
  for (let index = 0; index < 5; index += 1) {
    const accepted = await repository.acceptPrompt({
      at: index * 10,
      sessionId,
      submissionId: toSubmissionId(`submission-${index}`),
      text: `Fact ${index}`,
    });
    sessionId = accepted.sessionId;
    const attemptId = toAttemptId(`attempt-${index}`);
    await repository.claimNextTurn({
      at: index * 10 + 1,
      attemptId,
      epoch: accepted.epoch,
      sessionId,
    });
    await repository.finishTurn({
      at: index * 10 + 2,
      attemptId,
      epoch: accepted.epoch,
      sessionId,
      status: "completed",
      text: `Remembered ${index}`,
      turnId: accepted.turnId,
    });
  }
  if (!sessionId) throw new Error("fixture failed");
  const conversation = await repository.getConversation(sessionId);
  if (!conversation) throw new Error("fixture failed");
  return conversation;
}

describe("compactConversation", () => {
  it("validates a candidate and commits it only after a replacement session is created", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const conversation = await completedConversation(repository);
    const { adapter, lifecycle } = createFakeModelAdapter({
      chunks: ["Fact 0 remains important."],
    });

    const result = await compactConversation({
      adapter,
      conversation,
      personality: (await repository.getSettings()).personality,
      repository,
    });

    expect(result.ok).toBe(true);
    expect((await repository.getConversation(conversation.session.id))?.context?.summaryText).toBe(
      "Fact 0 remains important.",
    );
    expect(lifecycle.created).toBe(2);
    expect(result.ok ? result.session : null).not.toBeNull();
    if (result.ok) result.session.destroy();
    expect(lifecycle.destroyed).toBe(2);
  });

  it("keeps the prior context and cleans up when the summary is empty", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const conversation = await completedConversation(repository);
    const { adapter, lifecycle } = createFakeModelAdapter({ chunks: [] });

    const result = await compactConversation({
      adapter,
      conversation,
      personality: (await repository.getSettings()).personality,
      repository,
    });

    expect(result).toEqual({ ok: false, code: "empty_response" });
    expect((await repository.getConversation(conversation.session.id))?.context).toBeNull();
    expect(lifecycle.destroyed).toBe(lifecycle.created);
  });

  it("rejects an oversized summarization input before streaming", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const conversation = await completedConversation(repository);
    const { adapter, lifecycle } = createFakeModelAdapter({
      chunks: ["Must not commit"],
      context: { usage: 101, window: 100 },
    });

    await expect(
      compactConversation({
        adapter,
        conversation,
        personality: (await repository.getSettings()).personality,
        repository,
      }),
    ).resolves.toEqual({ ok: false, code: "context_too_large" });
    expect((await repository.getConversation(conversation.session.id))?.context).toBeNull();
    expect(lifecycle).toEqual({ created: 1, destroyed: 1 });
  });

  it("preserves Chrome's filtered-output recovery code during compaction", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const conversation = await completedConversation(repository);
    const { adapter, lifecycle } = createFakeModelAdapter({
      chunks: ["Uncommitted candidate"],
      streamError: "output_filtered",
    });

    await expect(
      compactConversation({
        adapter,
        conversation,
        personality: (await repository.getSettings()).personality,
        repository,
      }),
    ).resolves.toEqual({ ok: false, code: "output_filtered" });
    expect((await repository.getConversation(conversation.session.id))?.context).toBeNull();
    expect(lifecycle.destroyed).toBe(lifecycle.created);
  });

  it("rolls back a candidate when history or personality changes before commit", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const conversation = await completedConversation(repository);
    const fake = createFakeModelAdapter({ chunks: ["Candidate facts"] });
    let creates = 0;
    const adapter = {
      availability: fake.adapter.availability,
      create: async (...input: Parameters<typeof fake.adapter.create>) => {
        creates += 1;
        if (creates === 2) await repository.savePersonality("Changed concurrently", 100);
        return fake.adapter.create(...input);
      },
    };

    await expect(
      compactConversation({
        adapter,
        conversation,
        personality: (await repository.getSettings()).personality,
        repository,
      }),
    ).resolves.toEqual({ ok: false, code: "revision_conflict" });
    expect((await repository.getConversation(conversation.session.id))?.context).toBeNull();
    expect(fake.lifecycle.destroyed).toBe(fake.lifecycle.created);
  });
});
