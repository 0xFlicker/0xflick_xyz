"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import Link from "next/link";

import type {
  SessionId,
  SessionListSnapshot,
  StorageState,
} from "@/features/assistant/types";

interface SessionSidebarProps {
  activeSessionId: SessionId | null;
  limitReached: boolean;
  mobileOpen: boolean;
  onClearAll: () => void;
  onCloseMobile: () => void;
  onDelete: (sessionId: SessionId) => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: SessionId) => void;
  sessions: SessionListSnapshot;
  storage: StorageState;
}

function SidebarContents({
  activeSessionId,
  limitReached,
  onClearAll,
  onDelete,
  onNewChat,
  onSelectSession,
  sessions,
  storage,
}: Omit<SessionSidebarProps, "mobileOpen" | "onCloseMobile">) {
  const temporary = storage.status === "temporary";
  const deletionUnverified = storage.status === "deletion_unverified";
  const titleCounts = new Map<string, number>();
  const titleOrdinals = new Map<SessionId, number>();
  sessions.sessions.forEach((session) => {
    const ordinal = (titleCounts.get(session.title) ?? 0) + 1;
    titleCounts.set(session.title, ordinal);
    titleOrdinals.set(session.id, ordinal);
  });
  return (
    <>
      <div className="flex items-center justify-between px-2 py-2">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Flick</p>
          <p className="mt-1 font-semibold tracking-tight">Local Assistant</p>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_16px_rgba(6,182,212,0.75)]" aria-hidden="true" />
      </div>
      <button
        aria-label="New chat"
        data-assistant-new-chat
        className="mt-5 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-semibold shadow-sm outline-none hover:border-cyan-300 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/10"
        disabled={limitReached}
        onClick={onNewChat}
        type="button"
      >
        <span className="mr-2 text-cyan-600 dark:text-cyan-300">＋</span> New chat
      </button>
      {limitReached ? (
        <p className="mt-2 px-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
          100 chats saved. Delete one before starting another.
        </p>
      ) : null}
      <nav aria-label="Saved chats" className="mt-5 min-h-0 flex-1 overflow-y-auto">
        <p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-400">
          {temporary ? "This visit" : "Browser history"}
        </p>
        <ul className="space-y-1">
          {sessions.sessions.map((session) => (
            <li className="group flex items-center gap-1" key={session.id}>
              <button
                aria-current={activeSessionId === session.id ? "page" : undefined}
                aria-label={
                  (titleCounts.get(session.title) ?? 0) > 1
                    ? `${session.title}, chat ${titleOrdinals.get(session.id)} of ${titleCounts.get(session.title)}`
                    : session.title
                }
                className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-left text-sm text-zinc-600 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:text-zinc-300 dark:hover:bg-white/5 dark:aria-[current=page]:bg-white dark:aria-[current=page]:text-zinc-950"
                onClick={() => onSelectSession(session.id)}
                type="button"
              >
                <span className="block truncate">{session.title}</span>
                {(titleCounts.get(session.title) ?? 0) > 1 ? (
                  <span className="mt-0.5 block text-[0.65rem] opacity-70">
                    Chat {titleOrdinals.get(session.id)} of {titleCounts.get(session.title)}
                  </span>
                ) : null}
              </button>
              <button
                aria-label={
                  (titleCounts.get(session.title) ?? 0) > 1
                    ? `Delete ${session.title}, chat ${titleOrdinals.get(session.id)} of ${titleCounts.get(session.title)}`
                    : `Delete ${session.title}`
                }
                className="rounded-lg p-2 text-xs text-zinc-400 opacity-70 outline-none hover:bg-red-50 hover:text-red-700 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 group-hover:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                onClick={() => onDelete(session.id)}
                type="button"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
        <p className={temporary ? "font-semibold text-amber-700 dark:text-amber-300" : "font-semibold text-zinc-700 dark:text-zinc-200"}>
          {temporary
            ? "Not saved"
            : deletionUnverified
              ? "Deletion not verified"
              : "Saved in this browser"}
        </p>
        <p>
          {temporary
            ? "This visit’s chats disappear when this page closes or reloads."
            : deletionUnverified
              ? "Browser history may still contain the data you tried to remove. Use browser site-data controls to verify deletion."
              : "Sessions may also be removed by clearing browser data or storage pressure."}
        </p>
        {sessions.sessions.length > 0 ? (
          <button
            className="mt-3 block font-semibold text-red-700 underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-300"
            onClick={onClearAll}
            type="button"
          >
            Clear all chats
          </button>
        ) : null}
        <Link className="mt-3 inline-flex font-semibold text-zinc-800 underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-zinc-200" href="/">
          Return to portfolio
        </Link>
      </div>
    </>
  );
}

export function SessionSidebar(props: SessionSidebarProps) {
  return (
    <>
      <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-200/80 bg-white/70 p-4 backdrop-blur-xl md:flex dark:border-white/10 dark:bg-zinc-950/70">
        <SidebarContents {...props} />
      </aside>
      <Dialog className="fixed inset-0 z-40 md:hidden" onClose={props.onCloseMobile} open={props.mobileOpen}>
        <DialogBackdrop className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm" />
        <div className="fixed inset-0 flex justify-start">
          <DialogPanel className="flex h-full w-[min(88vw,20rem)] flex-col border-r border-zinc-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-zinc-950">
            <DialogTitle className="sr-only">Local assistant chats</DialogTitle>
            <SidebarContents
              {...props}
              onClearAll={() => {
                props.onCloseMobile();
                props.onClearAll();
              }}
              onDelete={(sessionId) => {
                props.onCloseMobile();
                props.onDelete(sessionId);
              }}
              onNewChat={() => {
                props.onNewChat();
                props.onCloseMobile();
              }}
            />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
