import { describe, expect, it } from "vitest";

import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import {
  toAttemptId,
  toSubmissionId,
} from "@/features/assistant/types";

async function completedChat(repository: MemoryAssistantRepository) {
  const accepted = await repository.acceptPrompt({
    at: 1,
    sessionId: null,
    submissionId: toSubmissionId("initial"),
    text: "Initial turn",
  });
  const attemptId = toAttemptId("attempt");
  const claimed = await repository.claimNextTurn({
    at: 2,
    attemptId,
    epoch: accepted.epoch,
    sessionId: accepted.sessionId,
  });
  expect(claimed).not.toBeNull();
  await repository.finishTurn({
    at: 3,
    attemptId,
    epoch: accepted.epoch,
    sessionId: accepted.sessionId,
    status: "completed",
    text: "Initial answer",
    turnId: accepted.turnId,
  });
  return accepted;
}

describe("model selection repository contract", () => {
  it("confirms monotonically, activates latest only, and writes one atomic boundary", async () => {
    const repository = new MemoryAssistantRepository();
    const accepted = await completedChat(repository);
    const first = await repository.confirmModelRequest({
      at: 4,
      ownerWindowId: "window-a",
      reason: "visitor",
      requestId: "request-a",
      sessionId: accepted.sessionId,
      targetModelKey: "smollm2-360m-webgpu",
    });
    const second = await repository.confirmModelRequest({
      at: 5,
      ownerWindowId: "window-b",
      reason: "visitor",
      requestId: "request-b",
      sessionId: accepted.sessionId,
      targetModelKey: "smollm2-135m-wasm",
    });
    expect(first.ok && first.request?.revision).toBe(1);
    expect(second.ok && second.request?.revision).toBe(2);
    if (!first.ok || !first.request || !second.ok || !second.request) throw new Error("setup");

    await expect(repository.activateModelRequest({
      at: 6,
      context: null,
      descriptor: MODEL_CATALOG[1],
      expectedEpoch: first.request.capturedEpoch,
      expectedHistoryRevision: first.request.capturedHistoryRevision,
      ownerWindowId: "window-a",
      requestId: first.request.requestId,
      revision: first.request.revision,
      sessionId: accepted.sessionId,
    })).resolves.toEqual({ ok: false, code: "model_request_stale" });

    await expect(repository.activateModelRequest({
      at: 7,
      context: null,
      descriptor: MODEL_CATALOG[2],
      expectedEpoch: second.request.capturedEpoch,
      expectedHistoryRevision: second.request.capturedHistoryRevision,
      ownerWindowId: "window-b",
      requestId: second.request.requestId,
      revision: second.request.revision,
      sessionId: accepted.sessionId,
    })).resolves.toEqual({ ok: true });
    const conversation = await repository.getConversation(accepted.sessionId);
    expect(conversation?.session).toMatchObject({
      activeModelKey: "smollm2-135m-wasm",
      activeModelRevision: 2,
      pendingModelRequest: null,
    });
    expect(conversation?.boundaries).toHaveLength(1);
    expect(conversation?.boundaries[0]).toMatchObject({
      id: "request-b",
      afterTurnId: accepted.turnId,
      toDisplayName: "SmolLM2 135M",
      toExecutionName: "WASM",
    });
  });

  it("makes queued work busy and pending selection block prompt acceptance", async () => {
    const repository = new MemoryAssistantRepository();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("queued"),
      text: "Queued is active",
    });
    await expect(repository.confirmModelRequest({
      at: 2,
      ownerWindowId: "window-a",
      reason: "visitor",
      requestId: "busy",
      sessionId: accepted.sessionId,
      targetModelKey: "smollm2-135m-wasm",
    })).resolves.toEqual({ ok: false, code: "chat_busy" });

    const attemptId = toAttemptId("attempt");
    await repository.claimNextTurn({
      at: 3,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
    });
    await repository.finishTurn({
      at: 4,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
      status: "completed",
      text: "Done",
      turnId: accepted.turnId,
    });
    const confirmation = await repository.confirmModelRequest({
      at: 5,
      ownerWindowId: "window-a",
      reason: "visitor",
      requestId: "pending",
      sessionId: accepted.sessionId,
      targetModelKey: "smollm2-135m-wasm",
    });
    expect(confirmation.ok).toBe(true);
    await expect(repository.acceptPrompt({
      at: 6,
      sessionId: accepted.sessionId,
      submissionId: toSubmissionId("blocked"),
      text: "Do not replay me",
    })).rejects.toThrow("model_change_in_progress");
  });

  it("same-model confirmation is a no-op and failures or cancellation write no boundary", async () => {
    const repository = new MemoryAssistantRepository();
    const accepted = await completedChat(repository);
    await expect(repository.confirmModelRequest({
      at: 4,
      ownerWindowId: "window-a",
      reason: "visitor",
      requestId: "same",
      sessionId: accepted.sessionId,
      targetModelKey: "browser-prompt-api",
    })).resolves.toEqual({ ok: true, request: null });
    const confirmed = await repository.confirmModelRequest({
      at: 5,
      ownerWindowId: "window-a",
      reason: "visitor",
      requestId: "cancel",
      sessionId: accepted.sessionId,
      targetModelKey: "smollm2-135m-wasm",
    });
    if (!confirmed.ok || !confirmed.request) throw new Error("setup");
    await repository.cancelModelRequest({
      requestId: confirmed.request.requestId,
      revision: confirmed.request.revision,
      sessionId: accepted.sessionId,
    });
    expect((await repository.getConversation(accepted.sessionId))?.boundaries).toEqual([]);
  });

  it("intentional active removal preserves history and suppresses reopen fallback", async () => {
    const repository = new MemoryAssistantRepository();
    const accepted = await completedChat(repository);
    await repository.markModelRemoved("browser-prompt-api", 4);
    const before = await repository.getConversation(accepted.sessionId);
    expect(before?.session).toMatchObject({
      activeModelKey: "browser-prompt-api",
      requiresExplicitReplacement: true,
      modelUnavailableReason: "removed",
    });
    expect(before?.turns).toHaveLength(1);
    await expect(repository.activateReopenFallback({
      at: 5,
      descriptor: MODEL_CATALOG[2],
      expectedActiveModelKey: "browser-prompt-api",
      expectedActiveRevision: 0,
      sessionId: accepted.sessionId,
    })).resolves.toEqual({ ok: false, code: "model_not_ready" });
  });
});
