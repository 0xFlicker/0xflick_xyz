import { describe, expect, it } from "vitest";

import { createSwitchCompactionCandidate } from "@/features/assistant/context/compaction";
import { packTargetContext } from "@/features/assistant/context/contextManager";
import { blankPersonality } from "@/features/assistant/storage/repository";
import type { ConversationSnapshot, ModelPrompt } from "@/features/assistant/types";
import { toMessageId, toSessionId, toSubmissionId, toTurnId } from "@/features/assistant/types";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

function conversation(): ConversationSnapshot {
  const sessionId = toSessionId("session");
  const turns = [1, 2, 3].map((index) => ({
    id: toTurnId(`turn-${index}`),
    sessionId,
    epoch: 0,
    promptCreatedAt: index,
    submissionId: toSubmissionId(`submission-${index}`),
    userMessageId: toMessageId(`user-${index}`),
    assistantMessageId: toMessageId(`assistant-${index}`),
    status: "completed" as const,
    generationAttemptId: null,
    startedAt: index,
    completedAt: index,
    interruptionReason: null,
    failureCode: null,
    modelKey: "browser-prompt-api" as const,
    modelRevision: 0,
    modelRuntimeIdentity: "native",
  }));
  return {
    session: {
      id: sessionId,
      epoch: 0,
      title: "Context",
      titleSourceTurnId: turns[0].id,
      createdAt: 1,
      updatedAt: 3,
      historyRevision: 3,
      activeModelKey: "browser-prompt-api",
      activeModelRevision: 0,
      modelRequestRevision: 0,
      pendingModelRequest: null,
      requiresExplicitReplacement: false,
      modelUnavailableReason: "none",
    },
    turns,
    messages: turns.flatMap((turn, index) => [
      { id: turn.userMessageId, sessionId, turnId: turn.id, role: "user" as const, text: `User ${index + 1} ${"u".repeat(12)}`, status: "completed" as const, createdAt: index, updatedAt: index },
      { id: turn.assistantMessageId, sessionId, turnId: turn.id, role: "assistant" as const, text: `Assistant ${index + 1} ${"a".repeat(12)}`, status: "completed" as const, createdAt: index, updatedAt: index },
    ]),
    context: null,
    boundaries: [],
  };
}

function promptText(prompts: ModelPrompt[]): string {
  return prompts.map((prompt) => typeof prompt.content === "string" ? prompt.content : "media").join("\n");
}

describe("target model context packing", () => {
  it("uses target measurement, reserves output, and drops only whole oldest turns", async () => {
    const measured: string[] = [];
    const packed = await packTargetContext({
      conversation: conversation(),
      personality: blankPersonality(),
      outputAllowance: 20,
      measure: async (prompts) => {
        const text = promptText(prompts);
        measured.push(text);
        const turnCost = [1, 2, 3].filter((index) => text.includes(`User ${index}`)).length * 25;
        return { usage: 20 + turnCost, window: 90 };
      },
    });
    expect(packed.directTurnIds).toEqual([toTurnId("turn-2"), toTurnId("turn-3")]);
    expect(promptText(packed.prompts)).not.toContain("User 1");
    expect(promptText(packed.prompts)).toContain("User 2");
    expect(promptText(packed.prompts)).toContain("Assistant 3");
    expect(measured.length).toBeGreaterThan(1);
  });

  it("protects required current content and rejects required-only overflow", async () => {
    await expect(packTargetContext({
      conversation: conversation(),
      currentPrompt: [{ role: "user", content: "CURRENT-PROMPT-MUST-STAY" }],
      personality: blankPersonality(),
      outputAllowance: 20,
      measure: async (prompts) => ({
        usage: promptText(prompts).includes("CURRENT-PROMPT-MUST-STAY") ? 90 : 1,
        window: 100,
      }),
    })).rejects.toThrow("context_too_large");
  });

  it("uses a fitting source summary and otherwise silently falls back to newest turns", async () => {
    const source = conversation();
    const summaryCandidate = { appliesThroughTurnId: toTurnId("turn-2"), text: "CONDENSED" };
    const fitting = await packTargetContext({
      conversation: source,
      personality: blankPersonality(),
      outputAllowance: 10,
      summaryCandidate,
      measure: async (prompts) => ({ usage: promptText(prompts).length / 10, window: 200 }),
    });
    expect(fitting.summaryUsed).toBe(true);
    expect(promptText(fitting.prompts)).toContain("CONDENSED");
    expect(promptText(fitting.prompts)).toContain("User 3");
    expect(promptText(fitting.prompts)).not.toContain("User 1");

    const fallback = await packTargetContext({
      conversation: source,
      personality: blankPersonality(),
      outputAllowance: 10,
      summaryCandidate,
      measure: async (prompts) => ({
        usage: promptText(prompts).includes("CONDENSED") ? 500 : 20,
        window: 100,
      }),
    });
    expect(fallback.summaryUsed).toBe(false);
    expect(promptText(fallback.prompts)).not.toContain("CONDENSED");
    expect(promptText(fallback.prompts)).toContain("User 1");
    expect(promptText(fallback.prompts)).toContain("User 3");
  });

  it("makes one best-effort source compaction and returns null without surfacing failure", async () => {
    const successful = createFakeModelAdapter({ chunks: ["Source summary"] });
    await expect(createSwitchCompactionCandidate({
      adapter: successful.adapter,
      conversation: conversation(),
    })).resolves.toMatchObject({ text: "Source summary", appliesThroughTurnId: "turn-2" });

    const failed = createFakeModelAdapter({ streamError: "operation_failed" });
    await expect(createSwitchCompactionCandidate({
      adapter: failed.adapter,
      conversation: conversation(),
    })).resolves.toBeNull();
  });
});
