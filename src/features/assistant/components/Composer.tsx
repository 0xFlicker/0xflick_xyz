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
  const generating =
    work.status === "generating" ||
    work.status === "checking_context" ||
    work.status === "compacting";
  const canSend = !disabled && !generating && value.trim().length > 0;

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
