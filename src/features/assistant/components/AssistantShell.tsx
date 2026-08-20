import type { ReactNode } from "react";
import { useState } from "react";

import { ActivityStatus } from "@/features/assistant/components/ActivityStatus";
import { ContextDetails } from "@/features/assistant/components/ContextDetails";
import { SessionSidebar } from "@/features/assistant/components/SessionSidebar";
import { SettingsDialog } from "@/features/assistant/components/SettingsDialog";
import type {
  AssistantState,
  ConversationSnapshot,
  MutationResult,
  PersonalitySetting,
  SessionId,
  SessionListSnapshot,
} from "@/features/assistant/types";

interface AssistantShellProps {
  children: ReactNode;
  conversation: ConversationSnapshot | null;
  onNewChat: () => void;
  onClearAll: () => void;
  onCompact: () => void;
  onDeleteSession: (sessionId: SessionId) => void;
  onSelectSession: (sessionId: SessionId) => void;
  onSavePersonality: (text: string) => Promise<MutationResult>;
  personality: PersonalitySetting;
  sessions: SessionListSnapshot;
  state: AssistantState;
  canCompact: boolean;
}

export function AssistantShell({
  children,
  canCompact,
  conversation,
  onNewChat,
  onClearAll,
  onCompact,
  onDeleteSession,
  onSelectSession,
  onSavePersonality,
  personality,
  sessions,
  state,
}: AssistantShellProps) {
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const hasContextActivity =
    conversation !== null &&
    (conversation.context !== null || conversation.turns.length > 0);
  return (
    <main className="flex h-dvh w-full min-w-0 overflow-hidden bg-[#f4f5f3] text-zinc-950 dark:bg-[#090b0c] dark:text-white">
      <SessionSidebar
        activeSessionId={conversation?.session.id ?? null}
        limitReached={sessions.sessions.length >= 100}
        mobileOpen={mobileSessionsOpen}
        onClearAll={onClearAll}
        onCloseMobile={() => setMobileSessionsOpen(false)}
        onDelete={onDeleteSession}
        onNewChat={onNewChat}
        onSelectSession={(sessionId) => {
          onSelectSession(sessionId);
          setMobileSessionsOpen(false);
        }}
        sessions={sessions}
        storage={state.storage}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-zinc-200/70 px-4 sm:px-7 dark:border-white/10">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {conversation?.session.title ?? "New local chat"}
            </h1>
            <ActivityStatus state={state} />
          </div>
          <div className="flex items-center gap-2">
            {state.environment.status === "ready" && hasContextActivity ? (
              <ContextDetails
                canCompact={canCompact}
                context={conversation?.context ?? null}
                conversation={conversation}
                onCompact={onCompact}
                personalityActive={personality.text.length > 0}
              />
            ) : null}
            <SettingsDialog onSave={onSavePersonality} personality={personality} />
            <div className="flex items-center gap-2 md:hidden">
            <button
              className="rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10"
              data-assistant-chats
              onClick={() => setMobileSessionsOpen(true)}
              type="button"
            >
              Chats
            </button>
            </div>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
