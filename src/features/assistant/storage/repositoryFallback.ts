import type {
  AssistantRepository,
  RepositoryFailureListener,
  Unsubscribe,
} from "@/features/assistant/storage/repository";
import type {
  AcceptPromptInput,
  AcceptedTurn,
  ActivateModelRequestInput,
  ActivateReopenFallbackInput,
  CancelModelRequestInput,
  ClaimTurnInput,
  ClaimedTurn,
  ConfirmModelRequestInput,
  ConfirmModelRequestResult,
  ContextCompareAndSwap,
  ConversationSnapshot,
  FinishTurnInput,
  MutationResult,
  ModelKey,
  RepositoryMode,
  RepositorySnapshot,
  RecoverTurnInput,
  ResponseCheckpoint,
  SessionId,
  SessionListSnapshot,
  SettingsSnapshot,
  UpdateModelRequestInput,
} from "@/features/assistant/types";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";

const noopUnsubscribe: Unsubscribe = () => undefined;

export class RepositoryLifecycleCancelledError extends Error {
  constructor() {
    super("repository_lifecycle_cancelled");
    this.name = "RepositoryLifecycleCancelledError";
  }
}

export class ResilientAssistantRepository implements AssistantRepository {
  private active: AssistantRepository;
  private lifecycleRevision = 0;
  private temporaryActivated = false;
  private readonly sessionSubscriptions = new Set<{
    listener: (value: SessionListSnapshot) => void;
    onError?: RepositoryFailureListener;
    unsubscribe: Unsubscribe;
  }>();
  private readonly settingsSubscriptions = new Set<{
    listener: (value: SettingsSnapshot) => void;
    onError?: RepositoryFailureListener;
    unsubscribe: Unsubscribe;
  }>();
  private readonly conversationSubscriptions = new Set<{
    listener: (value: ConversationSnapshot | null) => void;
    onError?: RepositoryFailureListener;
    sessionId: SessionId;
    unsubscribe: Unsubscribe;
  }>();

  constructor(
    private readonly durable: AssistantRepository,
    private readonly temporary: AssistantRepository,
  ) {
    this.active = durable;
  }

  mode(): RepositoryMode {
    return this.active.mode();
  }

  async initialize(): Promise<RepositorySnapshot> {
    const lifecycleRevision = this.lifecycleRevision;
    try {
      return await this.active.initialize();
    } catch (error) {
      if (lifecycleRevision !== this.lifecycleRevision) {
        // Our own cleanup cancelled this attempt; it is not evidence that storage failed.
        throw new RepositoryLifecycleCancelledError();
      }
      return this.activateTemporary();
    }
  }

  destroy(): void {
    this.lifecycleRevision += 1;
    this.sessionSubscriptions.forEach((record) => record.unsubscribe());
    this.settingsSubscriptions.forEach((record) => record.unsubscribe());
    this.conversationSubscriptions.forEach((record) => record.unsubscribe());
    this.sessionSubscriptions.clear();
    this.settingsSubscriptions.clear();
    this.conversationSubscriptions.clear();
    this.durable.destroy();
    if (this.temporary !== this.durable) this.temporary.destroy();
  }

  acceptPrompt(input: AcceptPromptInput): Promise<AcceptedTurn> {
    return this.acceptWithFallback(input);
  }

  activateModelRequest(input: ActivateModelRequestInput): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.activateModelRequest(input), true);
  }

  activateReopenFallback(input: ActivateReopenFallbackInput): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.activateReopenFallback(input), true);
  }

  cancelModelRequest(input: CancelModelRequestInput): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.cancelModelRequest(input), true);
  }

  async confirmModelRequest(
    input: ConfirmModelRequestInput,
  ): Promise<ConfirmModelRequestResult> {
    if (this.temporaryActivated) return this.temporary.confirmModelRequest(input);
    const snapshot = await this.coherentSnapshot();
    try {
      const result = await this.durable.confirmModelRequest(input);
      if (
        result.ok ||
        (result.code !== "storage_unavailable" && result.code !== "storage_write_failed")
      ) return result;
      await this.activateTemporary(snapshot);
      return this.temporary.confirmModelRequest(input);
    } catch {
      await this.activateTemporary(snapshot);
      return this.temporary.confirmModelRequest(input);
    }
  }

  markModelRemoved(modelKey: ModelKey, at: number): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.markModelRemoved(modelKey, at), true);
  }

  updateModelRequest(input: UpdateModelRequestInput): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.updateModelRequest(input), true);
  }

  claimNextTurn(input: ClaimTurnInput): Promise<ClaimedTurn | null> {
    return this.claimWithFallback(input);
  }

  clearAll(at: number): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.clearAll(at), false);
  }

  commitContext(input: ContextCompareAndSwap): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.commitContext(input), true);
  }

  deleteSession(sessionId: SessionId, at: number): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.deleteSession(sessionId, at), false);
  }

  finishTurn(input: FinishTurnInput): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.finishTurn(input), true);
  }

  getConversation(sessionId: SessionId): Promise<ConversationSnapshot | null> {
    return this.active.getConversation(sessionId);
  }

  getSessions(): Promise<SessionListSnapshot> {
    return this.active.getSessions();
  }

  getSettings(): Promise<SettingsSnapshot> {
    return this.active.getSettings();
  }

  checkpointResponse(input: ResponseCheckpoint): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.checkpointResponse(input), true);
  }

  recoverTurn(input: RecoverTurnInput): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.recoverTurn(input), true);
  }

  savePersonality(text: string, at: number): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.savePersonality(text, at), true);
  }

  selectSession(sessionId: SessionId | null, at: number): Promise<MutationResult> {
    return this.mutateWithFallback(() => this.active.selectSession(sessionId, at), true);
  }

  subscribeConversation(
    sessionId: SessionId,
    listener: (value: ConversationSnapshot | null) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe {
    const record = {
      listener,
      onError,
      sessionId,
      unsubscribe: noopUnsubscribe,
    };
    record.unsubscribe = this.active.subscribeConversation(
      sessionId,
      listener,
      (code) => {
        onError?.(code);
        void this.handleSubscriptionFailure();
      },
    );
    this.conversationSubscriptions.add(record);
    return () => {
      record.unsubscribe();
      this.conversationSubscriptions.delete(record);
    };
  }

  subscribeSessions(
    listener: (value: SessionListSnapshot) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe {
    const record = {
      listener,
      onError,
      unsubscribe: noopUnsubscribe,
    };
    record.unsubscribe = this.active.subscribeSessions(listener, (code) => {
      onError?.(code);
      void this.handleSubscriptionFailure();
    });
    this.sessionSubscriptions.add(record);
    return () => {
      record.unsubscribe();
      this.sessionSubscriptions.delete(record);
    };
  }

  subscribeSettings(
    listener: (value: SettingsSnapshot) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe {
    const record = {
      listener,
      onError,
      unsubscribe: noopUnsubscribe,
    };
    record.unsubscribe = this.active.subscribeSettings(listener, (code) => {
      onError?.(code);
      void this.handleSubscriptionFailure();
    });
    this.settingsSubscriptions.add(record);
    return () => {
      record.unsubscribe();
      this.settingsSubscriptions.delete(record);
    };
  }

  private async acceptWithFallback(input: AcceptPromptInput): Promise<AcceptedTurn> {
    if (this.temporaryActivated) return this.temporary.acceptPrompt(input);
    const snapshot = await this.coherentSnapshot();
    try {
      return await this.durable.acceptPrompt(input);
    } catch {
      await this.activateTemporary(snapshot);
      return this.temporary.acceptPrompt(input);
    }
  }

  private async claimWithFallback(input: ClaimTurnInput): Promise<ClaimedTurn | null> {
    if (this.temporaryActivated) return this.temporary.claimNextTurn(input);
    const snapshot = await this.coherentSnapshot();
    try {
      return await this.durable.claimNextTurn(input);
    } catch {
      await this.activateTemporary(snapshot);
      return this.temporary.claimNextTurn(input);
    }
  }

  private async mutateWithFallback(
    mutation: () => Promise<MutationResult>,
    retryInMemory: boolean,
  ): Promise<MutationResult> {
    if (this.temporaryActivated) return mutation();
    const snapshot = await this.coherentSnapshot();
    try {
      const result = await mutation();
      if (
        result.ok ||
        (result.code !== "storage_unavailable" &&
          result.code !== "storage_write_failed" &&
          result.code !== "deletion_unverified")
      ) {
        return result;
      }
      await this.activateTemporary(snapshot);
      return retryInMemory ? mutation() : result;
    } catch {
      await this.activateTemporary(snapshot);
      return retryInMemory
        ? mutation()
        : { ok: false, code: "storage_write_failed" };
    }
  }

  private async coherentSnapshot(): Promise<RepositorySnapshot | null> {
    try {
      const sessions = await this.durable.getSessions();
      return {
        conversation: sessions.activeSessionId
          ? await this.durable.getConversation(sessions.activeSessionId)
          : null,
        sessions,
        settings: await this.durable.getSettings(),
      };
    } catch {
      return null;
    }
  }

  private async activateTemporary(
    snapshot: RepositorySnapshot | null = null,
  ): Promise<RepositorySnapshot> {
    if (!this.temporaryActivated) {
      this.durable.destroy();
      this.active = this.temporary;
      this.temporaryActivated = true;
    }
    const initial = await this.temporary.initialize();
    if (snapshot && this.temporary instanceof MemoryAssistantRepository) {
      this.temporary.hydrate(snapshot);
      this.rebindSubscriptions();
      return snapshot;
    }
    this.rebindSubscriptions();
    return initial;
  }

  private rebindSubscriptions(): void {
    this.sessionSubscriptions.forEach((record) => {
      record.unsubscribe();
      record.unsubscribe = this.active.subscribeSessions(record.listener, record.onError);
    });
    this.settingsSubscriptions.forEach((record) => {
      record.unsubscribe();
      record.unsubscribe = this.active.subscribeSettings(record.listener, record.onError);
    });
    this.conversationSubscriptions.forEach((record) => {
      record.unsubscribe();
      record.unsubscribe = this.active.subscribeConversation(
        record.sessionId,
        record.listener,
        record.onError,
      );
    });
  }

  private async handleSubscriptionFailure(): Promise<void> {
    if (this.temporaryActivated) return;
    const snapshot = await this.coherentSnapshot();
    await this.activateTemporary(snapshot);
  }
}
