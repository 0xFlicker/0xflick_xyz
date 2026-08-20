import { describe, expect, it, vi } from "vitest";

import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import {
  toAttemptId,
  toSubmissionId,
} from "@/features/assistant/types";

describe("MemoryAssistantRepository", () => {
  it("deduplicates a submission and orders equal-time turns deterministically", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();

    const first = await repository.acceptPrompt({
      at: 100,
      sessionId: null,
      submissionId: toSubmissionId("same-submission"),
      text: "First prompt",
    });
    const duplicate = await repository.acceptPrompt({
      at: 101,
      sessionId: first.sessionId,
      submissionId: toSubmissionId("same-submission"),
      text: "First prompt",
    });
    await repository.acceptPrompt({
      at: 100,
      sessionId: first.sessionId,
      submissionId: toSubmissionId("next-submission"),
      text: "Second prompt",
    });

    expect(duplicate).toEqual(first);
    const snapshot = await repository.getConversation(first.sessionId);
    expect(snapshot?.turns.map((turn) => turn.id)).toEqual(
      [...(snapshot?.turns ?? [])]
        .sort(
          (left, right) =>
            left.promptCreatedAt - right.promptCreatedAt ||
            left.id.localeCompare(right.id),
        )
        .map((turn) => turn.id),
    );
  });

  it("publishes checkpoints and lets the first terminal write win", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("submission"),
      text: "Stream this",
    });
    const attemptId = toAttemptId("attempt");
    const claimed = await repository.claimNextTurn({
      at: 2,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
    });
    const listener = vi.fn();
    repository.subscribeConversation(accepted.sessionId, listener);

    expect(claimed?.turn.id).toBe(accepted.turnId);
    await repository.checkpointResponse({
      at: 3,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
      text: "Partial answer",
      turnId: accepted.turnId,
    });
    expect(listener).toHaveBeenCalled();
    expect(
      (await repository.getConversation(accepted.sessionId))?.messages.find(
        (message) => message.role === "assistant",
      )?.text,
    ).toBe("Partial answer");

    await expect(
      repository.finishTurn({
        at: 4,
        attemptId,
        epoch: accepted.epoch,
        interruptionReason: "visitor",
        sessionId: accepted.sessionId,
        status: "interrupted",
        text: "Partial answer",
        turnId: accepted.turnId,
      }),
    ).resolves.toEqual({ ok: true });
    await expect(
      repository.finishTurn({
        at: 5,
        attemptId,
        epoch: accepted.epoch,
        sessionId: accepted.sessionId,
        status: "completed",
        text: "Late completion",
        turnId: accepted.turnId,
      }),
    ).resolves.toEqual({ ok: false, code: "already_terminal" });

    const terminal = await repository.getConversation(accepted.sessionId);
    expect(terminal?.turns[0].status).toBe("interrupted");
    expect(terminal?.messages.find((message) => message.role === "assistant")?.text).toBe(
      "Partial answer",
    );
  });

  it("starts a blank draft without deleting the prior temporary chat", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("submission"),
      text: "A retained chat",
    });

    await repository.selectSession(null, 2);

    expect((await repository.getSessions()).activeSessionId).toBeNull();
    expect((await repository.getConversation(accepted.sessionId))?.session.title).toBe(
      "A retained chat",
    );
  });
});
