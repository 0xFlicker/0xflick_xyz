declare const identifierBrand: unique symbol;

type Identifier<Name extends string> = string & {
  readonly [identifierBrand]: Name;
};

export type SessionId = Identifier<"SessionId">;
export type TurnId = Identifier<"TurnId">;
export type MessageId = Identifier<"MessageId">;
export type AttemptId = Identifier<"AttemptId">;
export type SubmissionId = Identifier<"SubmissionId">;
export type MediaHistoryId = Identifier<"MediaHistoryId">;

export type ModelKey =
  | "browser-prompt-api"
  | "smollm2-360m-webgpu"
  | "smollm2-135m-wasm";
export type ModelBackend = "prompt-api" | "webgpu" | "wasm";
export type ModelKind = "native" | "portable";
export type ModelDtype = "q4" | "default";
export type ModelRuntimeIdentity = string;

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

export function toMediaHistoryId(value: string): MediaHistoryId {
  return value as MediaHistoryId;
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
  activeModelKey: ModelKey;
  activeModelRevision: number;
  modelRequestRevision: number;
  pendingModelRequest: PendingModelRequest | null;
  requiresExplicitReplacement: boolean;
  modelUnavailableReason: ModelUnavailableReason;
}

export type ModelUnavailableReason =
  | "none"
  | "removed"
  | "evicted"
  | "unsupported"
  | "failed";

export type ModelRequestReason = "visitor" | "recommended";
export type ModelRequestStatus =
  | "preparing"
  | "checking"
  | "compacting"
  | "ready_to_commit";

export interface PendingModelRequest {
  requestId: string;
  revision: number;
  targetModelKey: ModelKey;
  sourceModelKey: ModelKey | null;
  ownerWindowId: string;
  reason: ModelRequestReason;
  status: ModelRequestStatus;
  capturedEpoch: number;
  capturedHistoryRevision: number;
  confirmedAt: Timestamp;
}

export interface ConfirmModelRequestInput {
  at: Timestamp;
  ownerWindowId: string;
  reason: ModelRequestReason;
  requestId: string;
  sessionId: SessionId;
  targetModelKey: ModelKey;
}

export type ConfirmModelRequestResult =
  | { ok: true; request: PendingModelRequest | null }
  | { ok: false; code: RepositoryErrorCode };

export interface UpdateModelRequestInput {
  requestId: string;
  revision: number;
  sessionId: SessionId;
  status: ModelRequestStatus;
}

export interface CancelModelRequestInput {
  requestId: string;
  revision: number;
  sessionId: SessionId;
}

export interface ActivateModelRequestInput extends CancelModelRequestInput {
  at: Timestamp;
  context: ContextState | null;
  descriptor: LocalModelDescriptor;
  expectedEpoch: number;
  expectedHistoryRevision: number;
  ownerWindowId: string;
}

export interface ActivateReopenFallbackInput {
  at: Timestamp;
  descriptor: LocalModelDescriptor;
  expectedActiveModelKey: ModelKey;
  expectedActiveRevision: number;
  sessionId: SessionId;
}

export interface ModelBoundary {
  id: string;
  sessionId: SessionId;
  selectionRevision: number;
  fromModelKey: ModelKey | null;
  toModelKey: ModelKey;
  toDisplayName: string;
  toExecutionName: string;
  reason: ModelRequestReason | "reopen_fallback";
  confirmation: "visitor" | "automatic_reopen";
  afterTurnId: TurnId | null;
  createdAt: Timestamp;
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
  | "empty_response"
  | "media_unavailable"
  | "media_rehydration_required"
  | "storage_quota"
  | "corrupt_assets"
  | "resource_exhausted"
  | "runtime_terminated"
  | "unsupported_device";

export type MediaKind = "image" | "audio";
export type MediaState = "none" | "ephemeral" | "requires_reattach" | "released";

export interface MediaPart {
  kind: MediaKind;
  source: Blob;
  mimeType: string;
  name: string;
  byteLength: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  accessibleLabel: string;
}

export interface MediaCapability {
  text: boolean;
  image: boolean;
  audio: boolean;
  observedAt: Timestamp;
  modelIdentity: string | null;
  error: ModelErrorCode | null;
}

export interface MediaHistoryRepresentation {
  id: MediaHistoryId;
  sessionId: SessionId;
  turnId: TurnId;
  messageId: MessageId;
  kind: MediaKind;
  thumbnail: Blob | null;
  label: string;
  accessibleLabel: string;
  mimeType: string;
  byteLength: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  createdAt: Timestamp;
}

export type MediaHistoryDraft = Omit<
  MediaHistoryRepresentation,
  "id" | "sessionId" | "turnId" | "messageId"
>;

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
  mediaKinds?: MediaKind[];
  mediaRepresentationIds?: MediaHistoryId[];
  mediaOwnerWindowId?: string | null;
  mediaState?: MediaState;
  modelKey: ModelKey;
  modelRevision: number;
  modelRuntimeIdentity: ModelRuntimeIdentity;
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
  mediaRepresentationIds?: MediaHistoryId[];
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
  modelKey: ModelKey;
  modelRevision: number;
  generatedByModelKey: ModelKey | null;
  appliesThroughTurnId: TurnId | null;
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
  boundaries: ModelBoundary[];
  context: ContextState | null;
  messages: Message[];
  session: AssistantSession;
  turns: ConversationTurn[];
  mediaRepresentations?: MediaHistoryRepresentation[];
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
  | "deletion_unverified"
  | "chat_busy"
  | "model_change_in_progress"
  | "model_request_stale"
  | "model_not_ready";

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
  model?: {
    key: ModelKey;
    revision: number;
    runtimeIdentity: ModelRuntimeIdentity;
  };
  media?: {
    kinds: MediaKind[];
    ownerWindowId: string;
    representations: MediaHistoryDraft[];
  };
}

export interface ClaimTurnInput {
  at: Timestamp;
  attemptId: AttemptId;
  epoch: number;
  sessionId: SessionId;
  ownerWindowId?: string;
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

export interface RecoverTurnInput {
  at: Timestamp;
  epoch: number;
  expectedAttemptId: AttemptId | null;
  sessionId: SessionId;
  turnId: TurnId;
}

export interface ContextCompareAndSwap {
  context: ContextState;
  expectedHistoryRevision: number;
  expectedPersonalityRevision: number;
}

export interface ModelPrompt {
  role: "system" | "user" | "assistant";
  content: string | ModelContentPart[];
}

export interface ModelContentPart {
  type: "text" | MediaKind;
  value: string | Blob;
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

export interface LocalModelCapabilities {
  text: boolean;
  image: boolean;
  audio: boolean;
}

export interface LocalModelDescriptor {
  key: ModelKey;
  displayName: string;
  executionName: string;
  rank: number;
  kind: ModelKind;
  backend: ModelBackend;
  capabilities: LocalModelCapabilities;
  task?: "text-generation";
  repository?: string;
  revision?: string;
  dtype: ModelDtype;
  approximateWeightBytes?: number;
  contextLimit: number | "dynamic";
  promptVersion: number;
}

export interface ModelAssetFile {
  path: string;
  size: number | null;
  cached: boolean;
}

export type ModelPreparationState =
  | "unprepared"
  | "preparing"
  | "loading"
  | "checking"
  | "ready"
  | "failed"
  | "removing"
  | "missing";

export interface ModelAssetSnapshot {
  modelKey: ModelKey;
  compatibility: "offered";
  state: ModelPreparationState;
  requiredFiles: ModelAssetFile[];
  expectedBytes: number | null;
  loadedBytes: number | null;
  progress: number | null;
  loadedRuntimeIdentity: ModelRuntimeIdentity | null;
  failure: ModelErrorCode | null;
  observedAt: Timestamp;
}

export interface LocalModelOption {
  descriptor: LocalModelDescriptor;
  asset: ModelAssetSnapshot;
  active: boolean;
  pending: boolean;
}

export type ModelCatalogState = {
  options: LocalModelOption[];
  selectedModelKey: ModelKey | null;
  activeModelKey: ModelKey | null;
  pendingModelKey: ModelKey | null;
} & (
  | { status: "checking" | "ready" | "unavailable" }
  | { status: "failed"; code: ModelErrorCode }
);

export type WorkState =
  | { status: "idle" }
  | { status: "queued"; turnId: TurnId }
  | { status: "checking_context"; turnId: TurnId }
  | { status: "compacting"; turnId: TurnId | null }
  | { status: "generating"; turnId: TurnId; hasContent: boolean }
  | { status: "completed"; turnId: TurnId | null }
  | { status: "stopped" }
  | { status: "failed"; code: ModelErrorCode };

export type StorageState =
  | { status: "initializing" }
  | { status: "durable" }
  | { status: "temporary"; reason: RepositoryErrorCode }
  | { status: "deletion_unverified" };

export interface AssistantState {
  models: ModelCatalogState;
  storage: StorageState;
  work: WorkState;
}
