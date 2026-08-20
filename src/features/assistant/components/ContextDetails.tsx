"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

import type {
  ContextState,
  ConversationSnapshot,
} from "@/features/assistant/types";

interface ContextDetailsProps {
  canCompact: boolean;
  context: ContextState | null;
  conversation?: ConversationSnapshot | null;
  onCompact: () => void;
  personalityActive?: boolean;
}

function label(context: ContextState | null): string {
  switch (context?.state) {
    case "fresh":
      return "Context used";
    case "warning":
      return "Nearing context limit";
    case "compacted":
      return "Compacted";
    case "overflowed":
      return "Context overflowed";
    case "unknown":
    case undefined:
      return "Context unknown";
  }
}

function percentage(context: ContextState | null): number | null {
  if (
    context?.contextUsage === null ||
    context?.contextWindow === null ||
    context?.contextUsage === undefined ||
    context?.contextWindow === undefined ||
    !Number.isFinite(context.contextUsage) ||
    !Number.isFinite(context.contextWindow) ||
    context.contextWindow <= 0
  ) {
    return null;
  }
  return Math.min(100, Math.max(0, (context.contextUsage / context.contextWindow) * 100));
}

export function ContextDetails({
  canCompact,
  context,
  conversation = null,
  onCompact,
  personalityActive = false,
}: ContextDetailsProps) {
  const [open, setOpen] = useState(false);
  const value = percentage(context);
  const contextLabel = label(context);
  const completedTurns = (conversation?.turns ?? [])
    .filter((turn) => turn.status === "completed")
    .sort(
      (left, right) =>
        left.promptCreatedAt - right.promptCreatedAt || left.id.localeCompare(right.id),
    );
  const summaryEnd = completedTurns.findIndex(
    (turn) => turn.id === context?.summarizedThroughTurnId,
  );
  const directStart = completedTurns.findIndex(
    (turn) => turn.id === context?.directFromTurnId,
  );

  return (
    <>
      <button
        aria-label="Context details"
        className="min-w-32 rounded-2xl px-3 py-2 text-left outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-white/10"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="block text-[0.68rem] font-semibold text-zinc-600 dark:text-zinc-300">
          {contextLabel}
        </span>
        {value === null ? null : (
          <progress
            aria-label="Conversation context usage"
            className="mt-1 block h-1.5 w-full accent-cyan-500"
            max={100}
            value={value}
          />
        )}
      </button>

      <Dialog className="fixed inset-0 z-50" onClose={setOpen} open={open}>
        <DialogBackdrop className="fixed inset-0 bg-zinc-950/45 backdrop-blur-sm data-[closed]:opacity-0" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Conversation context
            </DialogTitle>
            <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
              {contextLabel}{value === null ? "" : ` · ${Math.round(value)}%`}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Context is the conversation material active for the local model. At 75%, older detail may soon be condensed. The visible transcript is always kept unchanged.
            </p>
            <dl className="mt-5 space-y-3 rounded-2xl bg-zinc-100 p-4 text-sm dark:bg-white/5">
              <div>
                <dt className="font-semibold">Fixed assistant guidance</dt>
                <dd className="mt-1 text-zinc-600 dark:text-zinc-300">Always included.</dd>
              </div>
              <div>
                <dt className="font-semibold">Personality preference</dt>
                <dd className="mt-1 text-zinc-600 dark:text-zinc-300">
                  {personalityActive ? "Included as untrusted style guidance." : "Not set."}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Older turns</dt>
                <dd className="mt-1 text-zinc-600 dark:text-zinc-300">
                  {context?.summaryText
                    ? `${summaryEnd >= 0 ? `Turns 1–${summaryEnd + 1}` : "Earlier completed turns"} represented by AI-generated context: ${context.summaryText}`
                    : "Not summarized yet."}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Recent turns</dt>
                <dd className="mt-1 text-zinc-600 dark:text-zinc-300">
                  {context?.directFromTurnId
                    ? `${directStart >= 0 ? `Turns ${directStart + 1}–${completedTurns.length}` : "The most recent completed turns"} are included directly.`
                    : "Completed turns are included directly."}
                </dd>
              </div>
              {context?.compactedAt ? (
                <div>
                  <dt className="font-semibold">Last compaction</dt>
                  <dd className="mt-1 text-zinc-600 dark:text-zinc-300">
                    <time dateTime={new Date(context.compactedAt).toISOString()}>
                      {new Date(context.compactedAt).toLocaleString()}
                    </time>
                  </dd>
                </div>
              ) : null}
            </dl>
            {context?.state === "overflowed" ? (
              <p className="mt-4 text-sm font-medium text-amber-700 dark:text-amber-300">
                Chrome reported that older active context overflowed. Compact this chat before generating another context-complete answer.
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-white/10"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
              {canCompact ? (
                <button
                  className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  onClick={() => {
                    setOpen(false);
                    onCompact();
                  }}
                  type="button"
                >
                  Compact now
                </button>
              ) : null}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
