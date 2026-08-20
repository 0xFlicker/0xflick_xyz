import { v4 as uuid } from "uuid";

import {
  PERSONALITY_LIMIT,
  PROMPT_VERSION,
  SESSION_LIMIT,
  SESSION_TITLE_LIMIT,
} from "@/features/assistant/constants";
import {
  blankPersonality,
  sortSessions,
  type AssistantRepository,
  type Unsubscribe,
} from "@/features/assistant/storage/repository";
import type {
  AcceptPromptInput,
  AcceptedTurn,
  AppMeta,
  AssistantSession,
  ClaimTurnInput,
  ClaimedTurn,
  ContextCompareAndSwap,
  ContextState,
  ConversationSnapshot,
  ConversationTurn,
  FinishTurnInput,
  Message,
  MutationResult,
  PersonalitySetting,
  RepositorySnapshot,
  ResponseCheckpoint,
  SessionId,
  SessionListSnapshot,
  SettingsSnapshot,
  SubmissionId,
} from "@/features/assistant/types";
import {
  toMessageId,
  toSessionId,
  toTurnId,
} from "@/features/assistant/types";

type Listener<T> = (value: T) => void;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function countCodePoints(value: string): number {
  return Array.from(value).length;
}

export function titleFromPrompt(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const codePoints = Array.from(normalized);
  if (codePoints.length <= SESSION_TITLE_LIMIT) return normalized;
  return `${codePoints.slice(0, SESSION_TITLE_LIMIT - 1).join("")}…`;
}

export class MemoryAssistantRepository implements AssistantRepository {
  private readonly sessions = new Map<SessionId, AssistantSession>();
  private readonly turns = new Map<string, ConversationTurn>();
  private readonly messages = new Map<string, Message>();
  private readonly contexts = new Map<SessionId, ContextState>();
  private readonly submissions = new Map<SubmissionId, AcceptedTurn>();
  private readonly sessionListeners = new Set<Listener<SessionListSnapshot>>();
  private readonly settingsListeners = new Set<Listener<SettingsSnapshot>>();
  private readonly conversationListeners = new Map<
    SessionId,
    Set<Listener<ConversationSnapshot | null>>
  >();
  private meta: AppMeta = {
    key: "app",
    datasetEpoch: 0,
    activeSessionId: null,
    persistenceRequestedAt: null,
    updatedAt: 0,
  };
  private personality: PersonalitySetting = blankPersonality();
  private destroyed = false;

  mode(): "temporary" {
    return "temporary";
  }

  hydrate(snapshot: RepositorySnapshot): void {
    this.sessions.clear();
    this.turns.clear();
    this.messages.clear();
    this.contexts.clear();
    this.submissions.clear();
    this.meta = {
      ...this.meta,
      activeSessionId: snapshot.sessions.activeSessionId,
      datasetEpoch: snapshot.sessions.datasetEpoch,
      updatedAt: Date.now(),
    };
    snapshot.sessions.sessions.forEach((session) => this.sessions.set(session.id, clone(session)));
    this.personality = clone(snapshot.settings.personality);
    if (snapshot.conversation) {
      const conversation = snapshot.conversation;
      conversation.turns.forEach((turn) => {
        this.turns.set(turn.id, clone(turn));
        this.submissions.set(turn.submissionId, {
          epoch: turn.epoch,
          sessionId: turn.sessionId,
          turnId: turn.id,
        });
      });
      conversation.messages.forEach((message) => this.messages.set(message.id, clone(message)));
      if (conversation.context) {
        this.contexts.set(conversation.session.id, clone(conversation.context));
      }
    }
    this.emitSessions();
    this.emitSettings();
    if (snapshot.sessions.activeSessionId) {
      this.emitConversation(snapshot.sessions.activeSessionId);
    }
  }

  async initialize(): Promise<RepositorySnapshot> {
    return this.snapshot();
  }

  destroy(): void {
    this.destroyed = true;
    this.sessionListeners.clear();
    this.settingsListeners.clear();
    this.conversationListeners.clear();
  }

  async getSessions(): Promise<SessionListSnapshot> {
    return this.sessionSnapshot();
  }

  async getConversation(sessionId: SessionId): Promise<ConversationSnapshot | null> {
    return this.conversationSnapshot(sessionId);
  }

  async getSettings(): Promise<SettingsSnapshot> {
    return this.settingsSnapshot();
  }

  subscribeSessions(listener: Listener<SessionListSnapshot>): Unsubscribe {
    this.sessionListeners.add(listener);
    listener(this.sessionSnapshot());
    return () => this.sessionListeners.delete(listener);
  }

  subscribeConversation(
    sessionId: SessionId,
    listener: Listener<ConversationSnapshot | null>,
  ): Unsubscribe {
    const listeners = this.conversationListeners.get(sessionId) ?? new Set();
    listeners.add(listener);
    this.conversationListeners.set(sessionId, listeners);
    listener(this.conversationSnapshot(sessionId));
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.conversationListeners.delete(sessionId);
    };
  }

  subscribeSettings(listener: Listener<SettingsSnapshot>): Unsubscribe {
    this.settingsListeners.add(listener);
    listener(this.settingsSnapshot());
    return () => this.settingsListeners.delete(listener);
  }

  async selectSession(sessionId: SessionId | null, at: number): Promise<MutationResult> {
    if (sessionId && !this.sessions.has(sessionId)) {
      return { ok: false, code: "session_deleted" };
    }
    this.meta = { ...this.meta, activeSessionId: sessionId, updatedAt: at };
    this.emitSessions();
    return { ok: true };
  }

  async acceptPrompt(input: AcceptPromptInput): Promise<AcceptedTurn> {
    const text = input.text.trim();
    if (text.length === 0) throw new Error("invalid_input");

    const duplicate = this.submissions.get(input.submissionId);
    if (duplicate) return clone(duplicate);

    let session = input.sessionId ? this.sessions.get(input.sessionId) : undefined;
    if (input.sessionId && !session) throw new Error("session_deleted");
    if (!session && this.sessions.size >= SESSION_LIMIT) throw new Error("session_limit");

    const turnId = toTurnId(uuid());
    const sessionId = session?.id ?? toSessionId(uuid());
    const userMessageId = toMessageId(uuid());
    const assistantMessageId = toMessageId(uuid());

    if (!session) {
      session = {
        id: sessionId,
        epoch: this.meta.datasetEpoch,
        title: titleFromPrompt(text),
        titleSourceTurnId: turnId,
        createdAt: input.at,
        updatedAt: input.at,
        historyRevision: 0,
      };
      this.sessions.set(sessionId, session);
    }

    const turn: ConversationTurn = {
      id: turnId,
      sessionId,
      epoch: this.meta.datasetEpoch,
      promptCreatedAt: input.at,
      submissionId: input.submissionId,
      userMessageId,
      assistantMessageId,
      status: "queued",
      generationAttemptId: null,
      startedAt: null,
      completedAt: null,
      interruptionReason: null,
      failureCode: null,
    };
    const userMessage: Message = {
      id: userMessageId,
      sessionId,
      turnId,
      role: "user",
      text,
      status: "completed",
      createdAt: input.at,
      updatedAt: input.at,
    };
    const assistantMessage: Message = {
      id: assistantMessageId,
      sessionId,
      turnId,
      role: "assistant",
      text: "",
      status: "pending",
      createdAt: input.at,
      updatedAt: input.at,
    };
    this.turns.set(turnId, turn);
    this.messages.set(userMessageId, userMessage);
    this.messages.set(assistantMessageId, assistantMessage);
    this.sessions.set(sessionId, { ...session, updatedAt: input.at });
    this.meta = { ...this.meta, activeSessionId: sessionId, updatedAt: input.at };

    const accepted = { epoch: this.meta.datasetEpoch, sessionId, turnId };
    this.submissions.set(input.submissionId, accepted);
    this.emitSessions();
    this.emitConversation(sessionId);
    return clone(accepted);
  }

  async claimNextTurn(input: ClaimTurnInput): Promise<ClaimedTurn | null> {
    if (input.epoch !== this.meta.datasetEpoch) return null;
    if (!this.sessions.has(input.sessionId)) return null;

    const turn = this.sessionTurns(input.sessionId)
      .filter((candidate) => candidate.status === "queued")
      .sort(
        (left, right) =>
          left.promptCreatedAt - right.promptCreatedAt || left.id.localeCompare(right.id),
      )[0];
    if (!turn) return null;

    const claimedTurn: ConversationTurn = {
      ...turn,
      generationAttemptId: input.attemptId,
      startedAt: input.at,
      status: "generating",
    };
    const assistant = this.messages.get(turn.assistantMessageId);
    if (!assistant) return null;
    const streamingMessage: Message = {
      ...assistant,
      status: "streaming",
      updatedAt: input.at,
    };
    this.turns.set(turn.id, claimedTurn);
    this.messages.set(assistant.id, streamingMessage);
    this.emitConversation(input.sessionId);
    return clone({
      attemptId: input.attemptId,
      epoch: input.epoch,
      message: streamingMessage,
      sessionId: input.sessionId,
      turn: claimedTurn,
      turnId: turn.id,
    });
  }

  async checkpointResponse(input: ResponseCheckpoint): Promise<MutationResult> {
    const validated = this.validateGeneration(input);
    if (!validated.ok) return validated.result;
    this.messages.set(validated.message.id, {
      ...validated.message,
      status: "streaming",
      text: input.text,
      updatedAt: input.at,
    });
    this.emitConversation(input.sessionId);
    return { ok: true };
  }

  async finishTurn(input: FinishTurnInput): Promise<MutationResult> {
    const turn = this.turns.get(input.turnId);
    if (turn && ["completed", "interrupted", "failed"].includes(turn.status)) {
      return { ok: false, code: "already_terminal" };
    }
    const validated = this.validateGeneration(input);
    if (!validated.ok) return validated.result;

    const messageStatus = input.status === "completed" ? "completed" : input.status;
    this.messages.set(validated.message.id, {
      ...validated.message,
      status: messageStatus,
      text: input.text,
      updatedAt: input.at,
    });
    this.turns.set(validated.turn.id, {
      ...validated.turn,
      completedAt: input.at,
      failureCode: input.failureCode ?? null,
      interruptionReason: input.interruptionReason ?? null,
      status: input.status,
    });
    const session = this.sessions.get(input.sessionId);
    if (session) {
      this.sessions.set(input.sessionId, {
        ...session,
        historyRevision: session.historyRevision + 1,
        updatedAt: input.at,
      });
    }
    this.emitSessions();
    this.emitConversation(input.sessionId);
    return { ok: true };
  }

  async commitContext(input: ContextCompareAndSwap): Promise<MutationResult> {
    const session = this.sessions.get(input.context.sessionId);
    if (!session) return { ok: false, code: "session_deleted" };
    if (
      session.historyRevision !== input.expectedHistoryRevision ||
      this.personality.revision !== input.expectedPersonalityRevision
    ) {
      return { ok: false, code: "revision_conflict" };
    }
    if (input.context.epoch !== this.meta.datasetEpoch) {
      return { ok: false, code: "dataset_cleared" };
    }
    this.contexts.set(input.context.sessionId, clone(input.context));
    this.emitConversation(input.context.sessionId);
    return { ok: true };
  }

  async savePersonality(text: string, at: number): Promise<MutationResult> {
    if (countCodePoints(text) > PERSONALITY_LIMIT) {
      return { ok: false, code: "invalid_input" };
    }
    this.personality = {
      key: "personality",
      revision: this.personality.revision + 1,
      text,
      updatedAt: at,
    };
    this.emitSettings();
    return { ok: true };
  }

  async deleteSession(sessionId: SessionId, at: number): Promise<MutationResult> {
    if (!this.sessions.has(sessionId)) return { ok: false, code: "session_deleted" };
    this.sessions.delete(sessionId);
    this.contexts.delete(sessionId);
    for (const turn of this.sessionTurns(sessionId)) {
      this.turns.delete(turn.id);
      this.messages.delete(turn.userMessageId);
      this.messages.delete(turn.assistantMessageId);
      this.submissions.delete(turn.submissionId);
    }
    if (this.meta.activeSessionId === sessionId) {
      this.meta = {
        ...this.meta,
        activeSessionId: sortSessions([...this.sessions.values()])[0]?.id ?? null,
        updatedAt: at,
      };
    }
    this.emitSessions();
    this.emitConversation(sessionId);
    return { ok: true };
  }

  async clearAll(at: number): Promise<MutationResult> {
    const affected = [...this.sessions.keys()];
    this.sessions.clear();
    this.turns.clear();
    this.messages.clear();
    this.contexts.clear();
    this.submissions.clear();
    this.personality = blankPersonality();
    this.meta = {
      ...this.meta,
      activeSessionId: null,
      datasetEpoch: this.meta.datasetEpoch + 1,
      updatedAt: at,
    };
    this.emitSessions();
    this.emitSettings();
    affected.forEach((sessionId) => this.emitConversation(sessionId));
    return { ok: true };
  }

  private validateGeneration(input: ResponseCheckpoint):
    | { ok: true; message: Message; turn: ConversationTurn }
    | { ok: false; result: MutationResult } {
    if (input.epoch !== this.meta.datasetEpoch) {
      return { ok: false, result: { ok: false, code: "dataset_cleared" } };
    }
    if (!this.sessions.has(input.sessionId)) {
      return { ok: false, result: { ok: false, code: "session_deleted" } };
    }
    const turn = this.turns.get(input.turnId);
    if (!turn) return { ok: false, result: { ok: false, code: "session_deleted" } };
    if (["completed", "interrupted", "failed"].includes(turn.status)) {
      return { ok: false, result: { ok: false, code: "already_terminal" } };
    }
    if (turn.status !== "generating" || turn.generationAttemptId !== input.attemptId) {
      return { ok: false, result: { ok: false, code: "revision_conflict" } };
    }
    const message = this.messages.get(turn.assistantMessageId);
    if (!message) return { ok: false, result: { ok: false, code: "session_deleted" } };
    return { ok: true, message, turn };
  }

  private snapshot(): RepositorySnapshot {
    const active = this.meta.activeSessionId;
    return {
      conversation: active ? this.conversationSnapshot(active) : null,
      sessions: this.sessionSnapshot(),
      settings: this.settingsSnapshot(),
    };
  }

  private sessionSnapshot(): SessionListSnapshot {
    return clone({
      activeSessionId: this.meta.activeSessionId,
      datasetEpoch: this.meta.datasetEpoch,
      sessions: sortSessions([...this.sessions.values()]),
    });
  }

  private settingsSnapshot(): SettingsSnapshot {
    return clone({ personality: this.personality });
  }

  private sessionTurns(sessionId: SessionId): ConversationTurn[] {
    return [...this.turns.values()].filter((turn) => turn.sessionId === sessionId);
  }

  private conversationSnapshot(sessionId: SessionId): ConversationSnapshot | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    const turns = this.sessionTurns(sessionId).sort(
      (left, right) =>
        left.promptCreatedAt - right.promptCreatedAt || left.id.localeCompare(right.id),
    );
    const orderedMessages: Message[] = [];
    for (const turn of turns) {
      const user = this.messages.get(turn.userMessageId);
      const assistant = this.messages.get(turn.assistantMessageId);
      if (user) orderedMessages.push(user);
      if (assistant) orderedMessages.push(assistant);
    }
    return clone({
      context: this.contexts.get(sessionId) ?? null,
      messages: orderedMessages,
      session,
      turns,
    });
  }

  private emitSessions(): void {
    if (this.destroyed) return;
    const snapshot = this.sessionSnapshot();
    this.sessionListeners.forEach((listener) => listener(snapshot));
  }

  private emitSettings(): void {
    if (this.destroyed) return;
    const snapshot = this.settingsSnapshot();
    this.settingsListeners.forEach((listener) => listener(snapshot));
  }

  private emitConversation(sessionId: SessionId): void {
    if (this.destroyed) return;
    const snapshot = this.conversationSnapshot(sessionId);
    this.conversationListeners
      .get(sessionId)
      ?.forEach((listener) => listener(snapshot));
  }
}
