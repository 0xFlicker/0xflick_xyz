import {
  CONTEXT_COMPACTION_RATIO,
  CONTEXT_WARNING_RATIO,
  PORTABLE_OUTPUT_TOKEN_ALLOWANCE,
} from "@/features/assistant/constants";
import type {
  ConversationSnapshot,
  ContextStatus,
  ConversationTurn,
  ModelContext,
  ModelPrompt,
  PersonalitySetting,
  TurnId,
} from "@/features/assistant/types";
import { buildReconstructionPrompts } from "@/features/assistant/context/prompt";

export interface ContextAssessment {
  blocked: boolean;
  ratio: number | null;
  shouldCompact: boolean;
  state: ContextStatus;
}

interface ContextMeasurement extends ModelContext {
  overflowed: boolean;
}

export interface TargetContextPack {
  directTurnIds: TurnId[];
  measurement: ModelContext;
  prompts: ModelPrompt[];
  summaryUsed: boolean;
}

interface PackTargetContextInput {
  conversation: ConversationSnapshot;
  currentPrompt?: ModelPrompt[];
  measure: (prompts: ModelPrompt[]) => Promise<ModelContext>;
  outputAllowance?: number;
  personality: PersonalitySetting;
  summaryCandidate?: { appliesThroughTurnId: TurnId; text: string } | null;
}

function validMeasurement(
  measurement: ModelContext,
): measurement is { usage: number; window: number } {
  const { usage, window } = measurement;
  return (
    usage !== null &&
    window !== null &&
    Number.isFinite(usage) &&
    Number.isFinite(window) &&
    usage >= 0 &&
    window > 0
  );
}

export function evaluateContext(measurement: ContextMeasurement): ContextAssessment {
  if (measurement.overflowed) {
    return {
      blocked: true,
      ratio: validMeasurement(measurement)
        ? measurement.usage / measurement.window
        : null,
      shouldCompact: true,
      state: "overflowed",
    };
  }

  if (!validMeasurement(measurement)) {
    return {
      blocked: false,
      ratio: null,
      shouldCompact: false,
      state: "unknown",
    };
  }

  const ratio = measurement.usage / measurement.window;
  return {
    blocked: false,
    ratio,
    shouldCompact: ratio >= CONTEXT_COMPACTION_RATIO,
    state: ratio >= CONTEXT_WARNING_RATIO ? "warning" : "fresh",
  };
}

export function projectedContext(
  current: ModelContext,
  additional: ModelContext,
): ModelContext {
  if (
    !validMeasurement(current) ||
    !validMeasurement(additional) ||
    current.window !== additional.window
  ) {
    return { usage: null, window: null };
  }
  return {
    usage: current.usage + additional.usage,
    window: current.window,
  };
}

export function completedConversationTurns(
  turns: ConversationTurn[],
): ConversationTurn[] {
  return turns
    .filter((turn) => turn.status === "completed")
    .sort(
      (left, right) =>
        left.promptCreatedAt - right.promptCreatedAt || left.id.localeCompare(right.id),
    );
}

function fits(measurement: ModelContext, outputAllowance: number): boolean {
  return (
    measurement.usage !== null &&
    measurement.window !== null &&
    measurement.window > 0 &&
    measurement.usage + outputAllowance <= measurement.window
  );
}

export async function packTargetContext({
  conversation,
  currentPrompt = [],
  measure,
  outputAllowance = PORTABLE_OUTPUT_TOKEN_ALLOWANCE,
  personality,
  summaryCandidate = null,
}: PackTargetContextInput): Promise<TargetContextPack> {
  const allCompleted = completedConversationTurns(conversation.turns);
  const summarizedIndex = summaryCandidate
    ? allCompleted.findIndex((turn) => turn.id === summaryCandidate.appliesThroughTurnId)
    : -1;
  const requiredPrompts = [
    ...buildReconstructionPrompts({
      conversation,
      personality,
      summaryOverride: null,
      turnIds: [],
    }),
    ...currentPrompt,
  ];
  const requiredMeasurement = await measure(requiredPrompts);
  if (!fits(requiredMeasurement, outputAllowance)) {
    throw new Error("context_too_large");
  }

  let summaryUsed = false;
  if (summaryCandidate) {
    const withSummary = [
      ...buildReconstructionPrompts({
        conversation,
        personality,
        summaryOverride: summaryCandidate.text,
        turnIds: [],
      }),
      ...currentPrompt,
    ];
    const summaryMeasurement = await measure(withSummary);
    summaryUsed = fits(summaryMeasurement, outputAllowance);
  }

  const completed = summaryUsed && summarizedIndex >= 0
    ? allCompleted.slice(summarizedIndex + 1)
    : allCompleted;

  const kept: TurnId[] = [];
  let prompts = requiredPrompts;
  let measurement = requiredMeasurement;
  for (const turn of [...completed].reverse()) {
    const candidateIds = [turn.id, ...kept];
    const candidatePrompts = [
      ...buildReconstructionPrompts({
        conversation,
        personality,
        summaryOverride: summaryUsed ? summaryCandidate?.text ?? null : null,
        turnIds: candidateIds,
      }),
      ...currentPrompt,
    ];
    const candidateMeasurement = await measure(candidatePrompts);
    if (!fits(candidateMeasurement, outputAllowance)) continue;
    kept.unshift(turn.id);
    prompts = candidatePrompts;
    measurement = candidateMeasurement;
  }
  if (summaryUsed && kept.length === 0) {
    prompts = [
      ...buildReconstructionPrompts({
        conversation,
        personality,
        summaryOverride: summaryCandidate?.text ?? null,
        turnIds: [],
      }),
      ...currentPrompt,
    ];
    measurement = await measure(prompts);
  }
  return { directTurnIds: kept, measurement, prompts, summaryUsed };
}
