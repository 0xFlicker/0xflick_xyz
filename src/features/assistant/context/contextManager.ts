import {
  CONTEXT_COMPACTION_RATIO,
  CONTEXT_WARNING_RATIO,
  RECENT_TURN_TARGET,
} from "@/features/assistant/constants";
import type {
  ContextStatus,
  ConversationTurn,
  ModelContext,
} from "@/features/assistant/types";

export interface ContextAssessment {
  blocked: boolean;
  ratio: number | null;
  shouldCompact: boolean;
  state: ContextStatus;
}

interface ContextMeasurement extends ModelContext {
  overflowed: boolean;
}

export interface TurnPartition {
  directTurns: ConversationTurn[];
  summaryTurns: ConversationTurn[];
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

export function partitionCompletedTurns(
  turns: ConversationTurn[],
  directTurnTarget = RECENT_TURN_TARGET,
): TurnPartition {
  const completed = turns
    .filter((turn) => turn.status === "completed")
    .sort(
      (left, right) =>
        left.promptCreatedAt - right.promptCreatedAt || left.id.localeCompare(right.id),
    );
  const directStart = Math.max(0, completed.length - directTurnTarget);
  return {
    summaryTurns: completed.slice(0, directStart),
    directTurns: completed.slice(directStart),
  };
}
