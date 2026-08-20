import { useEffect, useMemo, useRef, useState } from "react";

import { MessageContent } from "@/features/assistant/components/MessageContent";
import type {
  ConversationSnapshot,
  Message,
  TurnId,
} from "@/features/assistant/types";

interface TranscriptProps {
  conversation: ConversationSnapshot | null;
  onRetry: (turnId: TurnId) => void;
}

function terminalLabel(message: Message): string | null {
  switch (message.status) {
    case "interrupted":
      return "Stopped";
    case "failed":
      return "Response failed";
    default:
      return null;
  }
}

export function Transcript({ conversation, onRetry }: TranscriptProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);
  const [copyState, setCopyState] = useState<Record<string, "copied" | "failed">>(
    {},
  );
  const messagesById = useMemo(
    () =>
      new Map(conversation?.messages.map((message) => [message.id, message] as const)),
    [conversation],
  );

  useEffect(() => {
    if (!following) return;
    const viewport = viewportRef.current;
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [conversation, following]);

  function trackScroll(): void {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    setFollowing(distance < 96);
  }

  async function copy(message: Message): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopyState((current) => ({ ...current, [message.id]: "copied" }));
    } catch {
      setCopyState((current) => ({ ...current, [message.id]: "failed" }));
    }
  }

  const turns = conversation?.turns ?? [];
  return (
    <div className="relative min-h-0 flex-1">
      <div
        aria-busy={turns.some((turn) => turn.status === "generating")}
        aria-label="Conversation transcript"
        className="h-full overflow-y-auto overscroll-contain px-4 py-8 sm:px-8 lg:px-12"
        onScroll={trackScroll}
        ref={viewportRef}
        tabIndex={0}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          {turns.length === 0 ? (
            <section className="my-auto py-16">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
                Private by design
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-5xl dark:text-white">
                Think here, on this device.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
                A focused assistant for explanation, writing, and problem-solving—without sending your conversation to an AI service.
              </p>
            </section>
          ) : null}
          {turns.map((turn) => {
            const user = messagesById.get(turn.userMessageId);
            const assistant = messagesById.get(turn.assistantMessageId);
            if (!user || !assistant) return null;
            const label = terminalLabel(assistant);
            return (
              <article className="flex flex-col gap-5" key={turn.id}>
                <div className="ml-auto min-w-0 max-w-[88%] break-words whitespace-pre-wrap rounded-[1.4rem] rounded-br-md bg-zinc-900 px-5 py-3.5 text-[0.95rem] leading-7 text-white dark:bg-zinc-100 dark:text-zinc-950">
                  {user.text}
                </div>
                <div className="group min-w-0 max-w-full pl-1 sm:pl-4">
                  {assistant.text ? (
                    <MessageContent text={assistant.text} />
                  ) : (
                    <p className="text-sm text-zinc-500">
                      {turn.status === "queued" ? "Waiting for this session…" : "Thinking locally…"}
                    </p>
                  )}
                  {label ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                      {label}
                    </p>
                  ) : null}
                  {assistant.text ? (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 outline-none hover:bg-zinc-200/70 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:hover:bg-white/10 dark:hover:text-white"
                        onClick={() => void copy(assistant)}
                        type="button"
                      >
                        Copy response
                      </button>
                      <span aria-live="polite" className="text-xs text-zinc-500">
                        {copyState[assistant.id] === "copied"
                          ? "Copied"
                          : copyState[assistant.id] === "failed"
                            ? "Copy failed"
                            : null}
                      </span>
                    </div>
                  ) : null}
                  {turn.status === "failed" ? (
                    <button
                      className="mt-3 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                      onClick={() => onRetry(turn.id)}
                      type="button"
                    >
                      Retry response
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {!following ? (
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
          onClick={() => {
            setFollowing(true);
            const viewport = viewportRef.current;
            viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
          }}
          type="button"
        >
          Jump to latest
        </button>
      ) : null}
    </div>
  );
}
