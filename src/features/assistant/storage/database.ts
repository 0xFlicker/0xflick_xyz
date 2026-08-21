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

  constructor(name = ASSISTANT_DATABASE_NAME) {
    super(name);
    this.version(ASSISTANT_DATABASE_VERSION).stores({
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
  }
}
