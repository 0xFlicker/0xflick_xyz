import { liveQuery } from "dexie";
import { v4 as uuid } from "uuid";

import { PERSONALITY_LIMIT, SESSION_LIMIT } from "@/features/assistant/constants";
import { AssistantDatabase } from "@/features/assistant/storage/database";
import {
  blankPersonality,
  sortSessions,
  type AssistantRepository,
  type RepositoryFailureListener,
  type Unsubscribe,
} from "@/features/assistant/storage/repository";
import { titleFromPrompt } from "@/features/assistant/storage/memoryRepository";
import type {
  AcceptPromptInput,
  AcceptedTurn,
  AppMeta,
  AssistantSession,
  ClaimTurnInput,
  ClaimedTurn,
  ContextCompareAndSwap,
  ConversationSnapshot,
  ConversationTurn,
  FinishTurnInput,
  MediaHistoryRepresentation,
  Message,
  MutationResult,
  RepositoryErrorCode,
  RepositorySnapshot,
  ResponseCheckpoint,
  SessionId,
  SessionListSnapshot,
  SettingsSnapshot,
} from "@/features/assistant/types";
import { toMediaHistoryId, toMessageId, toSessionId, toTurnId } from "@/features/assistant/types";

export class RepositoryMutationError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode) {
    super(code);
    this.name = "RepositoryMutationError";
    this.code = code;
  }
}

function appMeta(at = 0): AppMeta {
  return {
    key: "app",
    activeSessionId: null,
    datasetEpoch: 0,
    persistenceRequestedAt: null,
    updatedAt: at,
  };
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function messageStatus(status: FinishTurnInput["status"]): Message["status"] {
  return status === "completed" ? "completed" : status;
}

export class DexieAssistantRepository implements AssistantRepository {
  private database: AssistantDatabase;
  private readonly databaseName: string;

  constructor(database = new AssistantDatabase()) {
    this.database = database;
    this.databaseName = database.name;
  }

  mode(): "durable" {
    return "durable";
  }

  async markUnownedMediaTurns(at: number): Promise<void> {
    await this.database.transaction(
      "rw",
      [this.database.sessions, this.database.turns, this.database.messages],
      async () => {
        const queued = (await this.database.turns.toArray()).filter(
          (turn) => turn.status === "queued" && (turn.mediaRepresentationIds ?? []).length > 0,
        );
        for (const turn of queued) {
          await this.database.turns.update(turn.id, {
            status: "interrupted",
            completedAt: at,
            interruptionReason: "owner_closed",
            mediaState: "requires_reattach",
            mediaOwnerWindowId: null,
          });
          await this.database.messages.update(turn.assistantMessageId, {
            status: "interrupted",
            updatedAt: at,
          });
          const session = await this.database.sessions.get(turn.sessionId);
          if (session) {
            await this.database.sessions.put({
              ...session,
              historyRevision: session.historyRevision + 1,
              updatedAt: at,
            });
          }
        }
      },
    );
  }

  async initialize(): Promise<RepositorySnapshot> {
    await this.database.open();
    await this.database.transaction(
      "rw",
      this.database.meta,
      this.database.settings,
      async () => {
        if (!(await this.database.meta.get("app"))) {
          await this.database.meta.add(appMeta());
        }
        if (!(await this.database.settings.get("personality"))) {
          await this.database.settings.add(blankPersonality());
        }
      },
    );
    const sessions = await this.getSessions();
    return {
      conversation: sessions.activeSessionId
        ? await this.getConversation(sessions.activeSessionId)
        : null,
      sessions,
      settings: await this.getSettings(),
    };
  }

  destroy(): void {
    const closing = this.database;
    // React may immediately initialize this repository again after a cleanup probe.
    // Give that setup a fresh Dexie connection instead of the explicitly closed one.
    this.database = new AssistantDatabase(this.databaseName);
    closing.close();
  }

  async getSessions(): Promise<SessionListSnapshot> {
    const [meta, sessions] = await Promise.all([
      this.database.meta.get("app"),
      this.database.sessions.toArray(),
    ]);
    const current = meta ?? appMeta();
    return {
      activeSessionId: current.activeSessionId,
      datasetEpoch: current.datasetEpoch,
      sessions: sortSessions(sessions),
    };
  }

  async getConversation(sessionId: SessionId): Promise<ConversationSnapshot | null> {
    const session = await this.database.sessions.get(sessionId);
    if (!session) return null;
    const [turns, messages, context, mediaRepresentations] = await Promise.all([
      this.database.turns.where("sessionId").equals(sessionId).toArray(),
      this.database.messages.where("sessionId").equals(sessionId).toArray(),
      this.database.contexts.get(sessionId),
      this.database.mediaHistory.where("sessionId").equals(sessionId).toArray(),
    ]);
    turns.sort(
      (left, right) =>
        left.promptCreatedAt - right.promptCreatedAt || left.id.localeCompare(right.id),
    );
    const byId = new Map(messages.map((message) => [message.id, message] as const));
    const ordered: Message[] = [];
    for (const turn of turns) {
      const user = byId.get(turn.userMessageId);
      const assistant = byId.get(turn.assistantMessageId);
      if (user) ordered.push(user);
      if (assistant) ordered.push(assistant);
    }
    return {
      context: context ?? null,
      messages: ordered,
      mediaRepresentations,
      session,
      turns,
    };
  }

  async getSettings(): Promise<SettingsSnapshot> {
    return {
      personality:
        (await this.database.settings.get("personality")) ?? blankPersonality(),
    };
  }

  subscribeSessions(
    listener: (value: SessionListSnapshot) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe {
    const subscription = liveQuery(() => this.getSessions()).subscribe({
      next: listener,
      error: () => onError?.("storage_unavailable"),
    });
    return () => subscription.unsubscribe();
  }

  subscribeConversation(
    sessionId: SessionId,
    listener: (value: ConversationSnapshot | null) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe {
    const subscription = liveQuery(() => this.getConversation(sessionId)).subscribe({
      next: listener,
      error: () => onError?.("storage_unavailable"),
    });
    return () => subscription.unsubscribe();
  }

  subscribeSettings(
    listener: (value: SettingsSnapshot) => void,
    onError?: RepositoryFailureListener,
  ): Unsubscribe {
    const subscription = liveQuery(() => this.getSettings()).subscribe({
      next: listener,
      error: () => onError?.("storage_unavailable"),
    });
    return () => subscription.unsubscribe();
  }

  async selectSession(sessionId: SessionId | null, at: number): Promise<MutationResult> {
    try {
      await this.database.transaction("rw", this.database.meta, this.database.sessions, async () => {
        if (sessionId && !(await this.database.sessions.get(sessionId))) {
          throw new RepositoryMutationError("session_deleted");
        }
        const meta = (await this.database.meta.get("app")) ?? appMeta(at);
        await this.database.meta.put({ ...meta, activeSessionId: sessionId, updatedAt: at });
      });
      return { ok: true };
    } catch (error) {
      return this.mutationFailure(error);
    }
  }

  async acceptPrompt(input: AcceptPromptInput): Promise<AcceptedTurn> {
    const text = input.text.trim();
    if (!text && !input.media?.representations.length) {
      throw new RepositoryMutationError("invalid_input");
    }

    const result = await this.database.transaction(
      "rw",
      [
        this.database.meta,
        this.database.sessions,
        this.database.turns,
        this.database.messages,
        this.database.mediaHistory,
        this.database.tombstones,
      ],
      async () => {
        const duplicate = await this.database.turns
          .where("submissionId")
          .equals(input.submissionId)
          .first();
        if (duplicate) {
          return {
            accepted: {
              epoch: duplicate.epoch,
              sessionId: duplicate.sessionId,
              turnId: duplicate.id,
            },
            requestPersistence: false,
          };
        }

        const meta = (await this.database.meta.get("app")) ?? appMeta(input.at);
        let session = input.sessionId
          ? await this.database.sessions.get(input.sessionId)
          : undefined;
        if (input.sessionId && !session) {
          throw new RepositoryMutationError("session_deleted");
        }
        if (!session && (await this.database.sessions.count()) >= SESSION_LIMIT) {
          throw new RepositoryMutationError("session_limit");
        }
        if (input.sessionId && (await this.database.tombstones.get(input.sessionId))) {
          throw new RepositoryMutationError("session_deleted");
        }

        const turnId = toTurnId(uuid());
        const sessionId = session?.id ?? toSessionId(uuid());
        const userMessageId = toMessageId(uuid());
        const assistantMessageId = toMessageId(uuid());
        const mediaRepresentations: MediaHistoryRepresentation[] = (
          input.media?.representations ?? []
        ).map((representation) => ({
          ...representation,
          id: toMediaHistoryId(uuid()),
          sessionId,
          turnId,
          messageId: userMessageId,
        }));
        if (!session) {
          session = {
            id: sessionId,
            epoch: meta.datasetEpoch,
            title: titleFromPrompt(
              text || mediaRepresentations[0]?.label || "Media question",
            ),
            titleSourceTurnId: turnId,
            createdAt: input.at,
            updatedAt: input.at,
            historyRevision: 0,
          };
          await this.database.sessions.add(session);
        }

        const turn: ConversationTurn = {
          id: turnId,
          sessionId,
          epoch: meta.datasetEpoch,
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
          mediaKinds: input.media?.kinds ?? [],
          mediaRepresentationIds: mediaRepresentations.map((representation) => representation.id),
          mediaOwnerWindowId: input.media?.ownerWindowId ?? null,
          mediaState: mediaRepresentations.length > 0 ? "ephemeral" : "none",
        };
        await this.database.turns.add(turn);
        await this.database.messages.bulkAdd([
          {
            id: userMessageId,
            sessionId,
            turnId,
            role: "user",
            text,
            status: "completed",
            createdAt: input.at,
            updatedAt: input.at,
            mediaRepresentationIds: mediaRepresentations.map((representation) => representation.id),
          },
          {
            id: assistantMessageId,
            sessionId,
            turnId,
            role: "assistant",
            text: "",
            status: "pending",
            createdAt: input.at,
            updatedAt: input.at,
          },
        ]);
        if (mediaRepresentations.length > 0) {
          await this.database.mediaHistory.bulkAdd(mediaRepresentations);
        }
        await this.database.sessions.update(sessionId, { updatedAt: input.at });
        const requestPersistence = meta.persistenceRequestedAt === null;
        await this.database.meta.put({
          ...meta,
          activeSessionId: sessionId,
          persistenceRequestedAt: requestPersistence ? input.at : meta.persistenceRequestedAt,
          updatedAt: input.at,
        });
        return {
          accepted: { epoch: meta.datasetEpoch, sessionId, turnId },
          requestPersistence,
        };
      },
    );

    if (result.requestPersistence) this.requestPersistentStorage();
    return result.accepted;
  }

  async claimNextTurn(input: ClaimTurnInput): Promise<ClaimedTurn | null> {
    return this.database.transaction(
      "rw",
      this.database.meta,
      this.database.sessions,
      this.database.turns,
      this.database.messages,
      async () => {
        const meta = (await this.database.meta.get("app")) ?? appMeta();
        if (input.epoch !== meta.datasetEpoch) return null;
        const session = await this.database.sessions.get(input.sessionId);
        if (!session) return null;

        const orphans = await this.database.turns
          .where("[sessionId+status]")
          .equals([input.sessionId, "generating"])
          .toArray();
        for (const orphan of orphans) {
          await this.database.turns.update(orphan.id, {
            completedAt: input.at,
            interruptionReason: "owner_closed",
            status: "interrupted",
          });
          await this.database.messages.update(orphan.assistantMessageId, {
            status: "interrupted",
            updatedAt: input.at,
          });
          session.historyRevision += 1;
        }

        const queued = await this.database.turns
          .where("[sessionId+status]")
          .equals([input.sessionId, "queued"])
          .toArray();
        queued.sort(
          (left, right) =>
            left.promptCreatedAt - right.promptCreatedAt || left.id.localeCompare(right.id),
        );
        const turn = queued.find(
          (candidate) =>
            candidate.mediaState === "none" ||
            (candidate.mediaOwnerWindowId !== null &&
              candidate.mediaOwnerWindowId === input.ownerWindowId),
        );
        if (!turn) {
          if (orphans.length > 0) await this.database.sessions.put(session);
          return null;
        }

        const claimedTurn: ConversationTurn = {
          ...turn,
          generationAttemptId: input.attemptId,
          startedAt: input.at,
          status: "generating",
        };
        const message = await this.database.messages.get(turn.assistantMessageId);
        if (!message) throw new RepositoryMutationError("storage_write_failed");
        const streaming: Message = { ...message, status: "streaming", updatedAt: input.at };
        await this.database.turns.put(claimedTurn);
        await this.database.messages.put(streaming);
        if (orphans.length > 0) await this.database.sessions.put(session);
        return {
          attemptId: input.attemptId,
          epoch: input.epoch,
          message: streaming,
          sessionId: input.sessionId,
          turn: claimedTurn,
          turnId: turn.id,
        };
      },
    );
  }

  async checkpointResponse(input: ResponseCheckpoint): Promise<MutationResult> {
    try {
      return await this.database.transaction(
        "rw",
        this.database.meta,
        this.database.sessions,
        this.database.turns,
        this.database.messages,
        this.database.tombstones,
        async () => {
          const validated = await this.validateGeneration(input);
          if (!validated.ok) return validated.result;
          await this.database.messages.update(validated.message.id, {
            status: "streaming",
            text: input.text,
            updatedAt: input.at,
          });
          return { ok: true };
        },
      );
    } catch (error) {
      return this.mutationFailure(error);
    }
  }

  async finishTurn(input: FinishTurnInput): Promise<MutationResult> {
    try {
      return await this.database.transaction(
        "rw",
        this.database.meta,
        this.database.sessions,
        this.database.turns,
        this.database.messages,
        this.database.tombstones,
        async () => {
          const existing = await this.database.turns.get(input.turnId);
          if (existing && ["completed", "interrupted", "failed"].includes(existing.status)) {
            return { ok: false, code: "already_terminal" };
          }
          const validated = await this.validateGeneration(input);
          if (!validated.ok) return validated.result;
          await this.database.messages.update(validated.message.id, {
            status: messageStatus(input.status),
            text: input.text,
            updatedAt: input.at,
          });
          await this.database.turns.update(validated.turn.id, {
            completedAt: input.at,
            failureCode: input.failureCode ?? null,
            interruptionReason: input.interruptionReason ?? null,
            status: input.status,
            mediaState:
              (validated.turn.mediaRepresentationIds ?? []).length > 0 ? "released" : "none",
            mediaOwnerWindowId: null,
          });
          const session = await this.database.sessions.get(input.sessionId);
          if (!session) return { ok: false, code: "session_deleted" };
          await this.database.sessions.put({
            ...session,
            historyRevision: session.historyRevision + 1,
            updatedAt: input.at,
          });
          return { ok: true };
        },
      );
    } catch (error) {
      return this.mutationFailure(error);
    }
  }

  async commitContext(input: ContextCompareAndSwap): Promise<MutationResult> {
    try {
      return await this.database.transaction(
        "rw",
        this.database.meta,
        this.database.sessions,
        this.database.settings,
        this.database.contexts,
        async () => {
          const meta = (await this.database.meta.get("app")) ?? appMeta();
          if (meta.datasetEpoch !== input.context.epoch) {
            return { ok: false, code: "dataset_cleared" };
          }
          const session = await this.database.sessions.get(input.context.sessionId);
          if (!session) return { ok: false, code: "session_deleted" };
          const personality =
            (await this.database.settings.get("personality")) ?? blankPersonality();
          if (
            session.historyRevision !== input.expectedHistoryRevision ||
            personality.revision !== input.expectedPersonalityRevision
          ) {
            return { ok: false, code: "revision_conflict" };
          }
          await this.database.contexts.put(input.context);
          return { ok: true };
        },
      );
    } catch (error) {
      return this.mutationFailure(error);
    }
  }

  async savePersonality(text: string, at: number): Promise<MutationResult> {
    if (codePointLength(text) > PERSONALITY_LIMIT) {
      return { ok: false, code: "invalid_input" };
    }
    try {
      await this.database.transaction("rw", this.database.settings, async () => {
        const current =
          (await this.database.settings.get("personality")) ?? blankPersonality();
        await this.database.settings.put({
          key: "personality",
          revision: current.revision + 1,
          text,
          updatedAt: at,
        });
      });
      return { ok: true };
    } catch (error) {
      return this.mutationFailure(error);
    }
  }

  async deleteSession(sessionId: SessionId, at: number): Promise<MutationResult> {
    try {
      return await this.database.transaction(
        "rw",
        [
          this.database.meta,
          this.database.sessions,
          this.database.turns,
          this.database.messages,
          this.database.mediaHistory,
          this.database.contexts,
          this.database.tombstones,
        ],
        async () => {
          const session = await this.database.sessions.get(sessionId);
          if (!session) return { ok: false, code: "session_deleted" };
          await this.database.tombstones.put({
            sessionId,
            epoch: session.epoch,
            deletedAt: at,
          });
          const turns = await this.database.turns.where("sessionId").equals(sessionId).toArray();
          const messages = await this.database.messages
            .where("sessionId")
            .equals(sessionId)
            .primaryKeys();
          await this.database.messages.bulkDelete(messages);
          await this.database.turns.bulkDelete(turns.map((turn) => turn.id));
          await this.database.mediaHistory
            .where("sessionId")
            .equals(sessionId)
            .delete();
          await this.database.contexts.delete(sessionId);
          await this.database.sessions.delete(sessionId);
          const meta = (await this.database.meta.get("app")) ?? appMeta(at);
          if (meta.activeSessionId === sessionId) {
            const remaining = sortSessions(await this.database.sessions.toArray());
            await this.database.meta.put({
              ...meta,
              activeSessionId: remaining[0]?.id ?? null,
              updatedAt: at,
            });
          }
          return { ok: true };
        },
      );
    } catch (error) {
      return { ok: false, code: "deletion_unverified" };
    }
  }

  async clearAll(at: number): Promise<MutationResult> {
    try {
      await this.database.transaction(
        "rw",
        [
          this.database.meta,
          this.database.sessions,
          this.database.turns,
          this.database.messages,
          this.database.mediaHistory,
          this.database.contexts,
          this.database.settings,
          this.database.tombstones,
        ],
        async () => {
          const current = (await this.database.meta.get("app")) ?? appMeta(at);
          await Promise.all([
            this.database.sessions.clear(),
            this.database.turns.clear(),
            this.database.messages.clear(),
            this.database.mediaHistory.clear(),
            this.database.contexts.clear(),
            this.database.settings.clear(),
            this.database.tombstones.clear(),
          ]);
          await this.database.meta.put({
            ...current,
            activeSessionId: null,
            datasetEpoch: current.datasetEpoch + 1,
            updatedAt: at,
          });
          await this.database.settings.put(blankPersonality());
        },
      );
      return { ok: true };
    } catch {
      return { ok: false, code: "deletion_unverified" };
    }
  }

  private async validateGeneration(input: ResponseCheckpoint): Promise<
    | { ok: true; message: Message; turn: ConversationTurn }
    | { ok: false; result: MutationResult }
  > {
    const meta = (await this.database.meta.get("app")) ?? appMeta();
    if (input.epoch !== meta.datasetEpoch) {
      return { ok: false, result: { ok: false, code: "dataset_cleared" } };
    }
    if (!(await this.database.sessions.get(input.sessionId))) {
      return { ok: false, result: { ok: false, code: "session_deleted" } };
    }
    if (await this.database.tombstones.get(input.sessionId)) {
      return { ok: false, result: { ok: false, code: "session_deleted" } };
    }
    const turn = await this.database.turns.get(input.turnId);
    if (!turn) return { ok: false, result: { ok: false, code: "session_deleted" } };
    if (["completed", "interrupted", "failed"].includes(turn.status)) {
      return { ok: false, result: { ok: false, code: "already_terminal" } };
    }
    if (turn.status !== "generating" || turn.generationAttemptId !== input.attemptId) {
      return { ok: false, result: { ok: false, code: "revision_conflict" } };
    }
    const message = await this.database.messages.get(turn.assistantMessageId);
    if (!message) return { ok: false, result: { ok: false, code: "session_deleted" } };
    return { ok: true, message, turn };
  }

  private mutationFailure(error: unknown): MutationResult {
    if (error instanceof RepositoryMutationError) return { ok: false, code: error.code };
    return { ok: false, code: "storage_write_failed" };
  }

  private requestPersistentStorage(): void {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return;
    void navigator.storage.persist().then(
      () => undefined,
      () => undefined,
    );
  }
}
