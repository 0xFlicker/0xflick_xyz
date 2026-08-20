import type {
  AssistantState,
  ModelAvailability,
  ModelErrorCode,
  RepositoryErrorCode,
  TurnId,
} from "@/features/assistant/types";

export const initialAssistantState: AssistantState = {
  environment: { status: "checking" },
  storage: { status: "initializing" },
  work: { status: "idle" },
};

export type AssistantAction =
  | { type: "environment/checking" }
  | { type: "environment/availability"; availability: ModelAvailability }
  | { type: "environment/progress"; fraction: number | null }
  | { type: "environment/finalizing" }
  | { type: "environment/ready" }
  | { type: "environment/failed"; code: ModelErrorCode }
  | { type: "storage/durable" }
  | { type: "storage/temporary"; reason: RepositoryErrorCode }
  | { type: "storage/deletion-unverified" }
  | { type: "work/idle" }
  | { type: "work/queued"; turnId: TurnId }
  | { type: "work/checking-context"; turnId: TurnId }
  | { type: "work/compacting"; turnId: TurnId | null }
  | { type: "work/generating"; turnId: TurnId; hasContent: boolean }
  | { type: "work/completed" }
  | { type: "work/stopped" }
  | { type: "work/failed"; code: ModelErrorCode };

function availabilityState(availability: ModelAvailability): AssistantState["environment"] {
  switch (availability.state) {
    case "available":
      return { status: "ready" };
    case "downloadable":
      return { status: "downloadable" };
    case "downloading":
      return { status: "downloading", fraction: null };
    case "unavailable":
      return { status: "unavailable" };
  }
}

export function assistantReducer(
  state: AssistantState,
  action: AssistantAction,
): AssistantState {
  switch (action.type) {
    case "environment/checking":
      return { ...state, environment: { status: "checking" } };
    case "environment/availability":
      return { ...state, environment: availabilityState(action.availability) };
    case "environment/progress":
      return {
        ...state,
        environment: { status: "downloading", fraction: action.fraction },
      };
    case "environment/finalizing":
      return { ...state, environment: { status: "finalizing" } };
    case "environment/ready":
      return { ...state, environment: { status: "ready" } };
    case "environment/failed":
      return { ...state, environment: { status: "failed", code: action.code } };
    case "storage/durable":
      return { ...state, storage: { status: "durable" } };
    case "storage/temporary":
      return { ...state, storage: { status: "temporary", reason: action.reason } };
    case "storage/deletion-unverified":
      return { ...state, storage: { status: "deletion_unverified" } };
    case "work/idle":
      return { ...state, work: { status: "idle" } };
    case "work/queued":
      return { ...state, work: { status: "queued", turnId: action.turnId } };
    case "work/checking-context":
      return {
        ...state,
        work: { status: "checking_context", turnId: action.turnId },
      };
    case "work/compacting":
      return { ...state, work: { status: "compacting", turnId: action.turnId } };
    case "work/generating":
      return {
        ...state,
        work: {
          status: "generating",
          turnId: action.turnId,
          hasContent: action.hasContent,
        },
      };
    case "work/completed":
      return { ...state, work: { status: "completed" } };
    case "work/stopped":
      return { ...state, work: { status: "stopped" } };
    case "work/failed":
      return { ...state, work: { status: "failed", code: action.code } };
  }
}
