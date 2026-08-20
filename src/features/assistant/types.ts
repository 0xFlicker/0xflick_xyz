declare const identifierBrand: unique symbol;

type Identifier<Name extends string> = string & {
  readonly [identifierBrand]: Name;
};

export type SessionId = Identifier<"SessionId">;
export type TurnId = Identifier<"TurnId">;
export type MessageId = Identifier<"MessageId">;
export type AttemptId = Identifier<"AttemptId">;
export type SubmissionId = Identifier<"SubmissionId">;

export function toSessionId(value: string): SessionId {
  return value as SessionId;
}

export function toTurnId(value: string): TurnId {
  return value as TurnId;
}

export function toMessageId(value: string): MessageId {
  return value as MessageId;
}

export function toAttemptId(value: string): AttemptId {
  return value as AttemptId;
}

export function toSubmissionId(value: string): SubmissionId {
  return value as SubmissionId;
}

export type Timestamp = number;

export interface AppMeta {
  key: "app";
  datasetEpoch: number;
  activeSessionId: SessionId | null;
  persistenceRequestedAt: Timestamp | null;
  updatedAt: Timestamp;
}

export interface AssistantSession {
  id: SessionId;
  epoch: number;
  title: string;
  titleSourceTurnId: TurnId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  historyRevision: number;
}

export type TurnStatus =
  | "queued"
  | "generating"
  | "completed"
  | "interrupted"
  | "failed";

export type InterruptionReason =
  | "visitor"
  | "owner_closed"
  | "session_switched"
  | "deleted"
  | "cleared"
  | "model_unavailable";

export type ModelErrorCode =
  | "activation_required"
  | "unsupported_input"
  | "download_failed"
  | "model_unavailable"
  | "output_filtered"
  | "context_too_large"
  | "aborted"
  | "operation_failed"
  | "api_changed"
  | "empty_response";

export interface ConversationTurn {
  id: TurnId;
  sessionId: SessionId;
  epoch: number;
  promptCreatedAt: Timestamp;
  submissionId: SubmissionId;
  userMessageId: MessageId;
  assistantMessageId: MessageId;
  status: TurnStatus;
  generationAttemptId: AttemptId | null;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  interruptionReason: InterruptionReason | null;
  failureCode: ModelErrorCode | null;
}

export type MessageRole = "user" | "assistant";
export type MessageStatus =
  | "pending"
  | "streaming"
  | "completed"
  | "interrupted"
  | "failed";

export interface Message {
  id: MessageId;
  sessionId: SessionId;
  turnId: TurnId;
  role: MessageRole;
  text: string;
  status: MessageStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ContextStatus =
  | "fresh"
  | "warning"
  | "compacted"
  | "overflowed"
  | "unknown";

export interface ContextState {
  sessionId: SessionId;
  epoch: number;
  state: ContextStatus;
  summaryText: string | null;
  summarizedThroughTurnId: TurnId | null;
  directFromTurnId: TurnId | null;
  contextUsage: number | null;
  contextWindow: number | null;
  promptVersion: number;
  sourceHistoryRevision: number;
  personalityRevision: number;
  compactedAt: Timestamp | null;
  overflowedAt: Timestamp | null;
}

export interface PersonalitySetting {
  key: "personality";
  text: string;
  revision: number;
  updatedAt: Timestamp;
}

export interface SessionTombstone {
  sessionId: SessionId;
  epoch: number;
  deletedAt: Timestamp;
}

export interface SessionListSnapshot {
  activeSessionId: SessionId | null;
  datasetEpoch: number;
  sessions: AssistantSession[];
}

export interface ConversationSnapshot {
  context: ContextState | null;
  messages: Message[];
  session: AssistantSession;
  turns: ConversationTurn[];
}

export interface SettingsSnapshot {
  personality: PersonalitySetting;
}

export interface RepositorySnapshot {
  conversation: ConversationSnapshot | null;
  sessions: SessionListSnapshot;
  settings: SettingsSnapshot;
}

export type RepositoryMode = "durable" | "temporary";

export type RepositoryErrorCode =
  | "session_limit"
  | "invalid_input"
  | "already_terminal"
  | "session_deleted"
  | "dataset_cleared"
  | "revision_conflict"
  | "storage_unavailable"
  | "storage_write_failed"
  | "deletion_unverified";

export type MutationResult =
  | { ok: true }
  | { ok: false; code: RepositoryErrorCode };

export interface AcceptedTurn {
  epoch: number;
  sessionId: SessionId;
  turnId: TurnId;
}

export interface ClaimedTurn extends AcceptedTurn {
  attemptId: AttemptId;
  message: Message;
  turn: ConversationTurn;
}

export interface AcceptPromptInput {
  at: Timestamp;
  sessionId: SessionId | null;
  submissionId: SubmissionId;
  text: string;
}

export interface ClaimTurnInput {
  at: Timestamp;
  attemptId: AttemptId;
  epoch: number;
  sessionId: SessionId;
}

export interface ResponseCheckpoint {
  at: Timestamp;
  attemptId: AttemptId;
  epoch: number;
  sessionId: SessionId;
  text: string;
  turnId: TurnId;
}

export interface FinishTurnInput extends ResponseCheckpoint {
  failureCode?: ModelErrorCode;
  interruptionReason?: InterruptionReason;
  status: "completed" | "interrupted" | "failed";
}

export interface ContextCompareAndSwap {
  context: ContextState;
  expectedHistoryRevision: number;
  expectedPersonalityRevision: number;
}

export interface ModelPrompt {
  role: "system" | "user" | "assistant";
  content: string;
}

export type ModelInput = string | ModelPrompt[];

export type ModelAvailability =
  | { state: "unavailable" }
  | { state: "downloadable" }
  | { state: "downloading" }
  | { state: "available" };

export type ModelProgress =
  | { state: "downloading"; fraction: number }
  | { state: "preparing" };

export interface ModelContext {
  usage: number | null;
  window: number | null;
}

export interface ModelFailure {
  code: ModelErrorCode;
}

export type EnvironmentState =
  | { status: "checking" }
  | { status: "unavailable" }
  | { status: "downloadable" }
  | { status: "downloading"; fraction: number | null }
  | { status: "preparing" }
  | { status: "ready" }
  | { status: "failed"; code: ModelErrorCode };

export type WorkState =
  | { status: "idle" }
  | { status: "queued"; turnId: TurnId }
  | { status: "checking_context"; turnId: TurnId }
  | { status: "compacting"; turnId: TurnId | null }
  | { status: "generating"; turnId: TurnId; hasContent: boolean }
  | { status: "completed" }
  | { status: "stopped" }
  | { status: "failed"; code: ModelErrorCode };

export type StorageState =
  | { status: "initializing" }
  | { status: "durable" }
  | { status: "temporary"; reason: RepositoryErrorCode }
  | { status: "deletion_unverified" };

export interface AssistantState {
  environment: EnvironmentState;
  storage: StorageState;
  work: WorkState;
}
