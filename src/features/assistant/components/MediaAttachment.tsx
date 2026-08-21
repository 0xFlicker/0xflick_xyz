import { useEffect, useState } from "react";

import { mediaRepresentationLabel } from "@/features/assistant/storage/mediaHistory";
import type { MediaHistoryRepresentation, MediaPart } from "@/features/assistant/types";

interface MediaAttachmentProps {
  part?: MediaPart;
  representation?: MediaHistoryRepresentation;
  temporary?: boolean;
}

export function MediaAttachment({ part, representation, temporary = false }: MediaAttachmentProps) {
  const source = part?.source ?? representation?.thumbnail ?? null;
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      setUrl(null);
      return;
    }
    if (typeof URL.createObjectURL !== "function") {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(source);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [source]);

  if (part?.kind === "image" || representation?.kind === "image") {
    const label = part?.accessibleLabel ?? representation?.accessibleLabel ?? "Attached image";
    return (
      <figure className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/20 bg-black/10 p-2">
        {url ? (
          // Blob-backed previews are local-only and cannot use Next's remote optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={label}
            className="h-16 w-16 rounded-xl object-cover"
            src={url}
          />
        ) : (
          <div
            aria-label={`${label}; preview unavailable`}
            className="flex h-16 w-16 items-center justify-center rounded-xl bg-black/10 text-xs"
            role="img"
          >
            Image
          </div>
        )}
        <figcaption className="min-w-0 text-xs leading-5">
          <span className="block truncate font-semibold">{part?.name ?? representation?.label}</span>
          <span className="block opacity-80">{representation ? mediaRepresentationLabel(representation) : label}</span>
          {temporary ? <span className="block opacity-80">Not saved</span> : null}
        </figcaption>
      </figure>
    );
  }

  const label = part?.accessibleLabel ?? representation?.accessibleLabel ?? "Attached audio";
  return (
    <div className="min-w-0 rounded-2xl border border-white/20 bg-black/10 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-semibold">{part?.name ?? representation?.label}</span>
        <span className="shrink-0 opacity-80">Audio</span>
      </div>
      {part && url ? (
        <audio aria-label={label} className="mt-2 w-full" controls src={url} />
      ) : null}
      <p className="mt-1 text-xs leading-5 opacity-80">
        {representation ? mediaRepresentationLabel(representation) : label}
        {temporary ? " · Not saved" : ""}
      </p>
    </div>
  );
}
