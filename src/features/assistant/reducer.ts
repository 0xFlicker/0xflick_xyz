import type {
  AssistantState,
  LocalModelOption,
  ModelErrorCode,
  ModelKey,
  RepositoryErrorCode,
  TurnId,
} from "@/features/assistant/types";

export const initialAssistantState: AssistantState = {
  models: {
    status: "checking",
    options: [],
    selectedModelKey: null,
    activeModelKey: null,
    pendingModelKey: null,
  },
  storage: { status: "initializing" },
  work: { status: "idle" },
};

export type AssistantAction =
  | { type: "models/checking" }
  | {
      type: "models/discovered";
      options: LocalModelOption[];
      selectedModelKey: ModelKey | null;
      activeModelKey: ModelKey | null;
      pendingModelKey: ModelKey | null;
    }
  | { type: "models/select"; modelKey: ModelKey }
  | { type: "models/activate"; modelKey: ModelKey }
  | { type: "models/pending"; modelKey: ModelKey | null }
  | { type: "models/failed"; code: ModelErrorCode }
  | { type: "storage/durable" }
  | { type: "storage/temporary"; reason: RepositoryErrorCode }
  | { type: "storage/deletion-unverified" }
  | { type: "work/idle" }
  | { type: "work/queued"; turnId: TurnId }
  | { type: "work/checking-context"; turnId: TurnId }
  | { type: "work/compacting"; turnId: TurnId | null }
  | { type: "work/generating"; turnId: TurnId; hasContent: boolean }
  | { type: "work/completed"; turnId: TurnId | null }
  | { type: "work/stopped" }
  | { type: "work/failed"; code: ModelErrorCode };

export function assistantReducer(
  state: AssistantState,
  action: AssistantAction,
): AssistantState {
  switch (action.type) {
    case "models/checking":
      return { ...state, models: { ...state.models, status: "checking" } };
    case "models/discovered":
      return {
        ...state,
        models: {
          status: action.options.length > 0 ? "ready" : "unavailable",
          options: action.options,
          selectedModelKey: action.selectedModelKey,
          activeModelKey: action.activeModelKey,
          pendingModelKey: action.pendingModelKey,
        },
      };
    case "models/select":
      return { ...state, models: { ...state.models, selectedModelKey: action.modelKey } };
    case "models/activate":
      return {
        ...state,
        models: {
          ...state.models,
          activeModelKey: action.modelKey,
          selectedModelKey: action.modelKey,
          pendingModelKey: null,
          options: state.models.options.map((option) => ({
            ...option,
            active: option.descriptor.key === action.modelKey,
            pending: false,
          })),
        },
      };
    case "models/pending":
      return {
        ...state,
        models: {
          ...state.models,
          pendingModelKey: action.modelKey,
          options: state.models.options.map((option) => ({
            ...option,
            pending: option.descriptor.key === action.modelKey,
          })),
        },
      };
    case "models/failed":
      return { ...state, models: { ...state.models, status: "failed", code: action.code } };
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
      return { ...state, work: { status: "completed", turnId: action.turnId } };
    case "work/stopped":
      return { ...state, work: { status: "stopped" } };
    case "work/failed":
      return { ...state, work: { status: "failed", code: action.code } };
  }
}
