import Dexie, { type Table } from "dexie";

import {
  ASSISTANT_DATABASE_NAME,
  ASSISTANT_DATABASE_VERSION,
} from "@/features/assistant/constants";
import type {
  AppMeta,
  AssistantSession,
  ContextState,
  ConversationTurn,
  Message,
  MediaHistoryRepresentation,
  ModelBoundary,
  PersonalitySetting,
  SessionTombstone,
} from "@/features/assistant/types";

export class AssistantDatabase extends Dexie {
  contexts!: Table<ContextState, string>;
  messages!: Table<Message, string>;
  meta!: Table<AppMeta, "app">;
  sessions!: Table<AssistantSession, string>;
  settings!: Table<PersonalitySetting, "personality">;
  tombstones!: Table<SessionTombstone, string>;
  turns!: Table<ConversationTurn, string>;
  mediaHistory!: Table<MediaHistoryRepresentation, string>;
  modelBoundaries!: Table<ModelBoundary, string>;

  constructor(name = ASSISTANT_DATABASE_NAME) {
    super(name);
    this.version(2).stores({
      contexts: "&sessionId, epoch, state",
      messages: "&id, sessionId, turnId, [sessionId+createdAt]",
      meta: "&key",
      sessions: "&id, epoch, updatedAt, [epoch+updatedAt]",
      settings: "&key",
      tombstones: "&sessionId, epoch",
      turns:
        "&id, sessionId, submissionId, [sessionId+status], [sessionId+promptCreatedAt]",
      mediaHistory:
        "&id, sessionId, turnId, messageId, createdAt, [sessionId+createdAt], [turnId+createdAt]",
    });
    this.version(ASSISTANT_DATABASE_VERSION)
      .stores({
        contexts: "&sessionId, epoch, state",
        messages: "&id, sessionId, turnId, [sessionId+createdAt]",
        meta: "&key",
        modelBoundaries:
          "&id, sessionId, selectionRevision, afterTurnId, createdAt, [sessionId+selectionRevision]",
        sessions: "&id, epoch, updatedAt, [epoch+updatedAt]",
        settings: "&key",
        tombstones: "&sessionId, epoch",
        turns:
          "&id, sessionId, submissionId, [sessionId+status], [sessionId+promptCreatedAt]",
        mediaHistory:
          "&id, sessionId, turnId, messageId, createdAt, [sessionId+createdAt], [turnId+createdAt]",
      })
      .upgrade(async (transaction) => {
        await transaction.table<AssistantSession>("sessions").toCollection().modify((session) => {
          session.activeModelKey = "browser-prompt-api";
          session.activeModelRevision = 0;
          session.modelRequestRevision = 0;
          session.pendingModelRequest = null;
          session.requiresExplicitReplacement = false;
          session.modelUnavailableReason = "none";
        });
        await transaction.table<ConversationTurn>("turns").toCollection().modify((turn) => {
          turn.modelKey = "browser-prompt-api";
          turn.modelRevision = 0;
          turn.modelRuntimeIdentity = "browser-prompt-api:native:prompt-api:default:1";
        });
        await transaction.table<ContextState>("contexts").toCollection().modify((context) => {
          context.modelKey = "browser-prompt-api";
          context.modelRevision = 0;
          context.generatedByModelKey = context.summaryText ? "browser-prompt-api" : null;
          context.appliesThroughTurnId = context.summarizedThroughTurnId;
        });
      });
  }
}
