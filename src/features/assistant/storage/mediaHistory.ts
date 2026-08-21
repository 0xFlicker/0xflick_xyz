import { v4 as uuid } from "uuid";

import type {
  MediaHistoryRepresentation,
  MediaHistoryDraft,
  MediaPart,
  MessageId,
  SessionId,
  TurnId,
} from "@/features/assistant/types";
import { toMediaHistoryId } from "@/features/assistant/types";

const THUMBNAIL_EDGE = 256;

async function imageThumbnail(source: Blob): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return null;
  }
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(source);
    const scale = Math.min(1, THUMBNAIL_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.78);
    });
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

export async function createMediaHistoryRepresentation(
  part: MediaPart,
  sessionId: SessionId,
  turnId: TurnId,
  messageId: MessageId,
  createdAt = Date.now(),
): Promise<MediaHistoryRepresentation> {
  const thumbnail = part.kind === "image" ? await imageThumbnail(part.source) : null;
  return {
    id: toMediaHistoryId(uuid()),
    sessionId,
    turnId,
    messageId,
    kind: part.kind,
    thumbnail,
    label: part.name || part.accessibleLabel,
    accessibleLabel: part.accessibleLabel,
    mimeType: part.mimeType,
    byteLength: Number.isFinite(part.byteLength) ? part.byteLength : null,
    width: part.width ?? null,
    height: part.height ?? null,
    durationSeconds: part.durationSeconds ?? null,
    createdAt,
  };
}

export async function createMediaHistoryDraft(part: MediaPart): Promise<MediaHistoryDraft> {
  let width = part.width ?? null;
  let height = part.height ?? null;
  if (part.kind === "image" && (width === null || height === null) && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(part.source);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      // Keep accessible metadata when local decoding is unavailable.
    }
  }
  return {
    kind: part.kind,
    thumbnail: part.kind === "image" ? await imageThumbnail(part.source) : null,
    label: part.name || part.accessibleLabel,
    accessibleLabel: part.accessibleLabel,
    mimeType: part.mimeType,
    byteLength: Number.isFinite(part.byteLength) ? part.byteLength : null,
    width,
    height,
    durationSeconds: part.durationSeconds ?? null,
    createdAt: Date.now(),
  };
}

export function mediaRepresentationLabel(
  representation: MediaHistoryRepresentation,
): string {
  const details = [representation.mimeType];
  if (representation.kind === "image" && representation.width && representation.height) {
    details.push(`${representation.width} × ${representation.height}`);
  }
  if (representation.kind === "audio" && representation.durationSeconds !== null) {
    details.push(`${Math.round(representation.durationSeconds)} seconds`);
  }
  return `${representation.label} (${details.join(", ")})`;
}
