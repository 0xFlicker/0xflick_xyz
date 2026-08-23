import type {
  AcceptPromptInput,
  AcceptedTurn,
  ActivateModelRequestInput,
  ActivateReopenFallbackInput,
  AssistantSession,
  ClaimTurnInput,
  ClaimedTurn,
  ConfirmModelRequestInput,
  ConfirmModelRequestResult,
  ContextCompareAndSwap,
  ConversationSnapshot,
  FinishTurnInput,
  MutationResult,
  ModelKey,
  MediaHistoryRepresentation,
  PersonalitySetting,
  RepositoryMode,
  RepositoryErrorCode,
  RepositorySnapshot,
  RecoverTurnInput,
  ResponseCheckpoint,
  CancelModelRequestInput,
  SessionId,
  SessionListSnapshot,
  SettingsSnapshot,
  UpdateModelRequestInput,
} from "@/features/assistant/types";

export type Unsubscribe = () => void;
export type RepositoryFailureListener = (code: RepositoryErrorCode) => void;

export interface AssistantRepository {
  acceptPrompt(input: AcceptPromptInput): Promise<AcceptedTurn>;
  activateModelRequest(input: ActivateModelRequestInput): Promise<MutationResult>;
  activateReopenFallback(input: ActivateReopenFallbackInput): Promise<MutationResult>;
  cancelModelRequest(input: CancelModelRequestInput): Promise<MutationResult>;
  claimNextTurn(input: ClaimTurnInput): Promise<ClaimedTurn | null>;
  clearAll(at: number): Promise<MutationResult>;
  commitContext(input: ContextCompareAndSwap): Promise<MutationResult>;
  confirmModelRequest(input: ConfirmModelRequestInput): Promise<ConfirmModelRequestResult>;
  deleteSession(sessionId: SessionId, at: number): Promise<MutationResult>;
  destroy(): void;
  finishTurn(input: FinishTurnInput): Promise<MutationResult>;
  getConversation(sessionId: SessionId): Promise<ConversationSnapshot | null>;
  getSessions(): Promise<SessionListSnapshot>;
  getSettings(): Promise<SettingsSnapshot>;
  initialize(): Promise<RepositorySnapshot>;
  markModelRemoved(modelKey: ModelKey, at: number): Promise<MutationResult>;
  mode(): RepositoryMode;
  checkpointResponse(input: ResponseCheckpoint): Promise<MutationResult>;
  recoverTurn(input: RecoverTurnInput): Promise<MutationResult>;
  savePersonality(text: string, at: number): Promise<MutationResult>;
  selectSession(sessionId: SessionId | null, at: number): Promise<MutationResult>;
  subscribeConversation(
    sessionId: SessionId,
    listener: (value: ConversationSnapshot | null) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe;
  subscribeSessions(
    listener: (value: SessionListSnapshot) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe;
  subscribeSettings(
    listener: (value: SettingsSnapshot) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe;
  updateModelRequest(input: UpdateModelRequestInput): Promise<MutationResult>;
}

export function mediaHistoryForConversation(
  conversation: ConversationSnapshot | null,
): MediaHistoryRepresentation[] {
  return conversation?.mediaRepresentations ?? [];
}

export const blankPersonality = (): PersonalitySetting => ({
  key: "personality",
  revision: 0,
  text: "",
  updatedAt: 0,
});

export function sortSessions(sessions: AssistantSession[]): AssistantSession[] {
  return [...sessions].sort(
    (left, right) => right.updatedAt - left.updatedAt || right.id.localeCompare(left.id),
  );
}
