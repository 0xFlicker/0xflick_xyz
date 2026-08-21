import type { ClipboardEvent, KeyboardEvent } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { MediaAttachment } from "@/features/assistant/components/MediaAttachment";
import type { MediaCapability, MediaKind, MediaPart, WorkState } from "@/features/assistant/types";

interface ComposerProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onStop: () => void;
  onSubmit: () => void;
  onMediaChange?: (parts: MediaPart[]) => void;
  media?: MediaPart[];
  capabilities?: MediaCapability | null;
  value: string;
  work: WorkState;
}

export interface ComposerHandle {
  addFiles: (files: File[]) => void;
}

async function readPart(file: File, kind: MediaKind): Promise<MediaPart> {
  if (file.size === 0 || (file.type && !file.type.startsWith(`${kind}/`))) {
    throw new Error("unsupported_media");
  }
  let width: number | undefined;
  let height: number | undefined;
  let durationSeconds: number | undefined;
  if (kind === "image" && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      // The model may still accept a readable source even when local preview decoding fails.
    }
  }
  if (
    kind === "audio" &&
    typeof window !== "undefined" &&
    typeof URL.createObjectURL === "function"
  ) {
    const url = URL.createObjectURL(file);
    try {
      durationSeconds = await new Promise<number | undefined>((resolve) => {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : undefined);
        audio.onerror = () => resolve(undefined);
        audio.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return {
    kind,
    source: file,
    mimeType: file.type || (kind === "image" ? "image/*" : "audio/*"),
    name: file.name || `${kind} attachment`,
    byteLength: file.size,
    width,
    height,
    durationSeconds,
    accessibleLabel: `${kind === "image" ? "Image" : "Audio"}: ${file.name || "selected attachment"}`,
  };
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer({
  disabled = false,
  onChange,
  onStop,
  onSubmit,
  onMediaChange = () => undefined,
  media = [],
  capabilities = null,
  value,
  work,
}: ComposerProps, ref) {
  const mediaInput = useRef<HTMLInputElement>(null);
  const validationEpoch = useRef(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const compacting = work.status === "compacting";
  const generating = work.status === "generating";
  const busy =
    work.status === "queued" ||
    work.status === "checking_context" ||
    compacting ||
    generating;
  const canSend = !disabled && !busy && (value.trim().length > 0 || media.length > 0);

  useEffect(() => {
    validationEpoch.current += 1;
  }, [media]);

  const addFiles = useCallback(async (files: File[]): Promise<void> => {
    if (files.length === 0) return;
    const epoch = ++validationEpoch.current;
    setMediaError(null);
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const kind: MediaKind | null = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("audio/")
            ? "audio"
            : null;
        if (
          !kind ||
          (kind === "image" && !capabilities?.image) ||
          (kind === "audio" && !capabilities?.audio)
        ) {
          throw new Error("unsupported_media");
        }
        return readPart(file, kind);
      }),
    );
    if (epoch !== validationEpoch.current) return;
    const valid = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    if (valid.length > 0) onMediaChange([...media, ...valid]);
    if (valid.length !== results.length) {
      const rejected = results
        .map((result, index) => ({ result, file: files[index] }))
        .filter(
          (item): item is { result: PromiseRejectedResult; file: File } =>
            item.result.status === "rejected",
        );
      const names = rejected.map(({ file }) => file.name || "unnamed attachment");
      const rejectedReason = rejected[0]?.result.reason;
      const reason = rejectedReason instanceof Error && rejectedReason.message === "unsupported_media"
        ? "unsupported or empty"
        : "could not be prepared";
      setMediaError(
        `${names.join(", ")} ${names.length === 1 ? "was" : "were"} ${reason}. Remove them or choose another file.`,
      );
    }
  }, [capabilities, media, onMediaChange]);

  useImperativeHandle(ref, () => ({ addFiles: (files) => void addFiles(files) }), [addFiles]);

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

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>): void {
    if (disabled || busy) return;

    const itemFiles = Array.from(event.clipboardData.items)
      .filter(
        (item) =>
          item.kind === "file" &&
          (item.type.startsWith("image/") || item.type.startsWith("audio/")),
      )
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    const directFiles = Array.from(event.clipboardData.files).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("audio/"),
    );
    const files = itemFiles.length > 0 ? itemFiles : directFiles;
    if (files.length === 0) return;

    event.preventDefault();
    void addFiles(files);
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
        onPaste={handlePaste}
        placeholder="Ask something, draft an idea, or think through a problem…"
        rows={3}
        value={value}
      />
      {media.length > 0 ? (
        <div aria-label="Staged attachments" className="grid gap-2 px-2 pb-2 sm:grid-cols-2">
          {media.map((part, index) => (
            <div className="relative" key={`${part.name}-${index}`}>
              <MediaAttachment part={part} temporary />
              <button
                aria-label={`Remove ${part.accessibleLabel}`}
                className="absolute right-2 top-2 rounded-full bg-zinc-950/80 px-2 py-1 text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                onClick={() => {
                  validationEpoch.current += 1;
                  onMediaChange(media.filter((_, itemIndex) => itemIndex !== index));
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {mediaError ? (
        <p className="px-3 pb-2 text-xs text-amber-700 dark:text-amber-300" role="alert">
          {mediaError}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3 px-2 pb-1">
        <div className="flex min-w-0 items-center gap-2">
          {capabilities?.image || capabilities?.audio ? (
            <input
              aria-label="Choose media attachments"
              accept={[capabilities.image ? "image/*" : null, capabilities.audio ? "audio/*" : null]
                .filter(Boolean)
                .join(",")}
              className="sr-only"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void addFiles(files);
              }}
              ref={mediaInput}
              type="file"
            />
          ) : null}
          {capabilities?.image || capabilities?.audio ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
              disabled={disabled || busy}
              onClick={() => mediaInput.current?.click()}
              type="button"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-4 w-4 items-center justify-center text-sm font-medium leading-none"
              >
                +
              </span>
              <MediaFileIcon />
              <span>Add media</span>
            </button>
          ) : null}
          <p className="hidden text-xs text-zinc-500 sm:block">Enter to send · Shift+Enter for a new line</p>
        </div>
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
});

function MediaFileIcon(): JSX.Element {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path d="M5.5 2.75h5.4l3.6 3.6v10.9H5.5a1.25 1.25 0 0 1-1.25-1.25V4A1.25 1.25 0 0 1 5.5 2.75Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.75 2.9v3.55h3.5M6.75 12.1l1.65-1.65 1.55 1.55 1.15-1.15 1.65 1.65M7 14.75h5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}
