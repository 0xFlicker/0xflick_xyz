import type {
  AcceptPromptInput,
  AcceptedTurn,
  AssistantSession,
  ClaimTurnInput,
  ClaimedTurn,
  ContextCompareAndSwap,
  ConversationSnapshot,
  FinishTurnInput,
  MutationResult,
  MediaHistoryRepresentation,
  PersonalitySetting,
  RepositoryMode,
  RepositoryErrorCode,
  RepositorySnapshot,
  ResponseCheckpoint,
  SessionId,
  SessionListSnapshot,
  SettingsSnapshot,
} from "@/features/assistant/types";

export type Unsubscribe = () => void;
export type RepositoryFailureListener = (code: RepositoryErrorCode) => void;

export interface AssistantRepository {
  acceptPrompt(input: AcceptPromptInput): Promise<AcceptedTurn>;
  claimNextTurn(input: ClaimTurnInput): Promise<ClaimedTurn | null>;
  clearAll(at: number): Promise<MutationResult>;
  commitContext(input: ContextCompareAndSwap): Promise<MutationResult>;
  deleteSession(sessionId: SessionId, at: number): Promise<MutationResult>;
  destroy(): void;
  finishTurn(input: FinishTurnInput): Promise<MutationResult>;
  getConversation(sessionId: SessionId): Promise<ConversationSnapshot | null>;
  getSessions(): Promise<SessionListSnapshot>;
  getSettings(): Promise<SettingsSnapshot>;
  initialize(): Promise<RepositorySnapshot>;
  mode(): RepositoryMode;
  markUnownedMediaTurns?(at: number): Promise<void>;
  checkpointResponse(input: ResponseCheckpoint): Promise<MutationResult>;
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
