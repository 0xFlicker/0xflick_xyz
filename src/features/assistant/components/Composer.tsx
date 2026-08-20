import type { KeyboardEvent } from "react";

import type { WorkState } from "@/features/assistant/types";

interface ComposerProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onStop: () => void;
  onSubmit: () => void;
  value: string;
  work: WorkState;
}

export function Composer({
  disabled = false,
  onChange,
  onStop,
  onSubmit,
  value,
  work,
}: ComposerProps) {
  const compacting = work.status === "compacting";
  const generating = work.status === "generating";
  const busy =
    work.status === "queued" ||
    work.status === "checking_context" ||
    compacting ||
    generating;
  const canSend = !disabled && !busy && value.trim().length > 0;

  if (compacting) {
    const automatic = work.turnId !== null;

    return (
      <div className="rounded-[1.6rem] border border-zinc-200 bg-white p-2 shadow-[0_18px_60px_-30px_rgba(24,24,27,0.35)] dark:border-white/10 dark:bg-zinc-900">
        <div className="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
          <span aria-hidden="true" className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Making room for this conversation…
            </p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {automatic
                ? "Your message will start automatically."
                : "You can continue when it’s ready."}
            </p>
          </div>
          {automatic ? (
            <button
              autoFocus
              className="shrink-0 rounded-full border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
              onClick={onStop}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) onSubmit();
  }

  return (
    <div className="rounded-[1.6rem] border border-zinc-200 bg-white p-2 shadow-[0_18px_60px_-30px_rgba(24,24,27,0.35)] dark:border-white/10 dark:bg-zinc-900">
      <label className="sr-only" htmlFor="assistant-composer">
        Message the local assistant
      </label>
      <textarea
        id="assistant-composer"
        className="min-h-24 w-full resize-none bg-transparent px-3 py-2 text-[1rem] leading-6 text-zinc-950 outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-white"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask something, draft an idea, or think through a problem…"
        rows={3}
        value={value}
      />
      <div className="flex items-center justify-between gap-3 px-2 pb-1">
        <p className="hidden text-xs text-zinc-500 sm:block">Enter to send · Shift+Enter for a new line</p>
        {generating ? (
          <button
            className="ml-auto rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white outline-none hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-950"
            onClick={onStop}
            type="button"
          >
            Stop response
          </button>
        ) : (
          <button
            className="ml-auto rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canSend}
            onClick={onSubmit}
            type="button"
          >
            Send message
          </button>
        )}
      </div>
    </div>
  );
}
