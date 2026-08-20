import { PROMPT_VERSION } from "@/features/assistant/constants";
import type { LocalModelSession } from "@/features/assistant/model/modelAdapter";
import type {
  ConversationSnapshot,
  SessionId,
  TurnId,
} from "@/features/assistant/types";

export interface ModelSessionIdentity {
  compactedAt: number | null;
  directFromTurnId: TurnId | null;
  historyRevision: number;
  personalityRevision: number;
  promptVersion: number;
  sessionId: SessionId | null;
  summarizedThroughTurnId: TurnId | null;
}

export function modelSessionIdentity(
  conversation: ConversationSnapshot | null,
  personalityRevision: number,
): ModelSessionIdentity {
  return {
    compactedAt: conversation?.context?.compactedAt ?? null,
    directFromTurnId: conversation?.context?.directFromTurnId ?? null,
    historyRevision: conversation?.session.historyRevision ?? 0,
    personalityRevision,
    promptVersion: conversation?.context?.promptVersion ?? PROMPT_VERSION,
    sessionId: conversation?.session.id ?? null,
    summarizedThroughTurnId:
      conversation?.context?.summarizedThroughTurnId ?? null,
  };
}

function equalIdentity(
  retained: ModelSessionIdentity,
  requested: ModelSessionIdentity,
): boolean {
  const sameSession =
    retained.sessionId === requested.sessionId ||
    (retained.sessionId === null &&
      retained.historyRevision === 0 &&
      retained.compactedAt === null &&
      requested.historyRevision === 0 &&
      requested.compactedAt === null);
  return (
    sameSession &&
    retained.historyRevision === requested.historyRevision &&
    retained.personalityRevision === requested.personalityRevision &&
    retained.promptVersion === requested.promptVersion &&
    retained.compactedAt === requested.compactedAt &&
    retained.summarizedThroughTurnId === requested.summarizedThroughTurnId &&
    retained.directFromTurnId === requested.directFromTurnId
  );
}

export class ModelSessionCache {
  private retained: {
    identity: ModelSessionIdentity;
    session: LocalModelSession;
  } | null = null;

  clear(): void {
    const retained = this.retained;
    this.retained = null;
    retained?.session.destroy();
  }

  store(identity: ModelSessionIdentity, session: LocalModelSession): void {
    if (this.retained?.session === session) {
      this.retained = { identity, session };
      return;
    }
    this.clear();
    this.retained = { identity, session };
  }

  invalidateUnless(identity: ModelSessionIdentity): void {
    if (this.retained && !equalIdentity(this.retained.identity, identity)) {
      this.clear();
    }
  }

  take(identity: ModelSessionIdentity): LocalModelSession | null {
    const retained = this.retained;
    this.retained = null;
    if (!retained) return null;
    if (equalIdentity(retained.identity, identity)) return retained.session;
    retained.session.destroy();
    return null;
  }
}
