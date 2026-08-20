"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

import type { ContextState } from "@/features/assistant/types";

interface ContextDetailsProps {
  canCompact: boolean;
  context: ContextState | null;
  onCompact: () => void;
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

function explanation(context: ContextState | null): string {
  switch (context?.state) {
    case "fresh":
      return "There is plenty of room for this conversation.";
    case "warning":
      return "Older messages will be condensed automatically when more room is needed.";
    case "compacted":
      return "Older messages were condensed to make room.";
    case "overflowed":
      return "This conversation needs more room before the assistant can continue.";
    case "unknown":
    case undefined:
      return "Chrome is not reporting a context limit for this conversation.";
  }
}

export function ContextDetails({
  canCompact,
  context,
  onCompact,
}: ContextDetailsProps) {
  const [open, setOpen] = useState(false);
  const value = percentage(context);
  const contextLabel = label(context);
  const roundedValue = value === null ? null : Math.round(value);

  return (
    <>
      <button
        aria-label="Context details"
        className="min-w-32 rounded-2xl px-3 py-2 text-left outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-white/10"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="flex items-center justify-between gap-3 text-[0.68rem] font-semibold text-zinc-600 dark:text-zinc-300">
          <span>{contextLabel}</span>
          {roundedValue === null ? null : <span>{roundedValue}%</span>}
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
          <DialogPanel className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900 sm:p-7">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Conversation context
            </DialogTitle>
            <p className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {roundedValue === null ? "Usage unavailable" : `${roundedValue}% used`}
            </p>
            {value === null ? null : (
              <progress
                aria-label="Conversation context usage details"
                className="mt-3 block h-2 w-full accent-cyan-500"
                max={100}
                value={value}
              />
            )}
            <p className="mt-5 text-sm font-medium leading-6 text-zinc-900 dark:text-white">
              {explanation(context)}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Your visible chat history stays unchanged.
            </p>

            {context?.summaryText ? (
              <details className="group mt-5 border-t border-zinc-200 pt-4 text-sm dark:border-white/10">
                <summary className="cursor-pointer list-none rounded-lg font-semibold text-zinc-700 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-zinc-300 dark:hover:text-white">
                  <span className="flex items-center justify-between gap-4">
                    See condensed summary
                    <span
                      aria-hidden="true"
                      className="text-lg font-normal transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <div className="mt-3 max-h-48 overflow-y-auto rounded-2xl bg-zinc-100 p-4 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    AI-generated summary
                  </p>
                  <p className="mt-2 whitespace-pre-wrap leading-6 text-zinc-700 dark:text-zinc-300">
                    {context.summaryText}
                  </p>
                </div>
              </details>
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
