import type { MediaPart } from "@/features/assistant/types";

function base64Bytes(value: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

function byteBuffer(bytes: number[]): ArrayBuffer {
  const output = new ArrayBuffer(bytes.length);
  new Uint8Array(output).set(bytes);
  return output;
}

export function imageFixture(name = "sample.png"): MediaPart {
  const source = new Blob(
    [
      base64Bytes(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      ),
    ],
    { type: "image/png" },
  );
  return {
    kind: "image",
    source,
    mimeType: source.type,
    name,
    byteLength: source.size,
    accessibleLabel: `Image: ${name}`,
  };
}

export function audioFixture(name = "sample.wav"): MediaPart {
  const source = new Blob(
    [
      byteBuffer([
        82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0,
        1, 0, 1, 0, 64, 31, 0, 0, 128, 62, 0, 0, 2, 0, 16, 0, 100, 97, 116, 97, 0, 0,
        0, 0,
      ]),
    ],
    { type: "audio/wav" },
  );
  return {
    kind: "audio",
    source,
    mimeType: source.type,
    name,
    byteLength: source.size,
    durationSeconds: 1,
    accessibleLabel: `Audio: ${name}`,
  };
}

export function corruptMediaFixture(kind: "image" | "audio"): MediaPart {
  const source = new Blob([], { type: kind === "image" ? "image/png" : "audio/wav" });
  return {
    kind,
    source,
    mimeType: source.type,
    name: `empty.${kind}`,
    byteLength: 0,
    accessibleLabel: `${kind === "image" ? "Image" : "Audio"}: empty attachment`,
  };
}
