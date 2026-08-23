import { describe, expect, it } from "vitest";

import {
  evaluateContext,
  completedConversationTurns,
  projectedContext,
} from "@/features/assistant/context/contextManager";
import type { ConversationTurn } from "@/features/assistant/types";
import {
  toMessageId,
  toSessionId,
  toSubmissionId,
  toTurnId,
} from "@/features/assistant/types";

const sessionId = toSessionId("session");

function turn(index: number, status: ConversationTurn["status"] = "completed"): ConversationTurn {
  return {
    id: toTurnId(`turn-${index}`),
    sessionId,
    epoch: 0,
    promptCreatedAt: index,
    submissionId: toSubmissionId(`submission-${index}`),
    userMessageId: toMessageId(`user-${index}`),
    assistantMessageId: toMessageId(`assistant-${index}`),
    status,
    generationAttemptId: null,
    startedAt: index,
    completedAt: index,
    interruptionReason: null,
    failureCode: null,
    modelKey: "browser-prompt-api",
    modelRevision: 0,
    modelRuntimeIdentity: "browser-prompt-api:native:prompt-api:default:1",
  };
}

describe("context policy", () => {
  it.each([
    [74, "fresh", false],
    [75, "warning", false],
    [79, "warning", false],
    [80, "warning", true],
  ] as const)("maps %s%% without estimating", (usage, state, shouldCompact) => {
    expect(evaluateContext({ usage, window: 100, overflowed: false })).toEqual({
      blocked: false,
      ratio: usage / 100,
      shouldCompact,
      state,
    });
  });

  it("reports unknown paired capacity and blocks explicit overflow", () => {
    expect(evaluateContext({ usage: null, window: 100, overflowed: false })).toEqual({
      blocked: false,
      ratio: null,
      shouldCompact: false,
      state: "unknown",
    });
    expect(evaluateContext({ usage: 20, window: 100, overflowed: true })).toMatchObject({
      blocked: true,
      state: "overflowed",
    });
  });

  it("returns completed turns in stable order without a fixed recent-turn cutoff", () => {
    const turns = [turn(1), turn(2), turn(3, "interrupted"), turn(4), turn(5), turn(6)];
    expect(completedConversationTurns(turns).map((item) => item.id)).toEqual([
      toTurnId("turn-1"),
      toTurnId("turn-2"),
      toTurnId("turn-4"),
      toTurnId("turn-5"),
      toTurnId("turn-6"),
    ]);
  });

  it("projects only paired measurements from the same reported window", () => {
    expect(
      projectedContext(
        { usage: 60, window: 100 },
        { usage: 20, window: 100 },
      ),
    ).toEqual({ usage: 80, window: 100 });
    expect(
      projectedContext(
        { usage: 60, window: 100 },
        { usage: 20, window: 200 },
      ),
    ).toEqual({ usage: null, window: null });
  });
});
