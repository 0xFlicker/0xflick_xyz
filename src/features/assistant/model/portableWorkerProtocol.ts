import type {
  ModelErrorCode,
  ModelPrompt,
  ModelRuntimeIdentity,
} from "@/features/assistant/types";

export const PORTABLE_WORKER_PROTOCOL_VERSION = 1;

export type PortableWorkerCommandKind =
  | "inspect"
  | "prepare"
  | "healthCheck"
  | "measure"
  | "generate"
  | "interrupt"
  | "dispose";

export interface PortableWorkerCommand {
  protocolVersion: number;
  kind: PortableWorkerCommandKind;
  attemptId: string;
  runtimeIdentity: ModelRuntimeIdentity;
  payload: {
    prompts?: ModelPrompt[];
    maxNewTokens?: number;
    model?: {
      repository: string;
      revision: string;
      backend: "webgpu" | "wasm";
      dtype: "q4";
      contextLimit: number;
    };
  };
}

interface PortableWorkerCommandInput {
  protocolVersion: number;
  kind: string;
  attemptId: string;
  runtimeIdentity: ModelRuntimeIdentity;
  payload: PortableWorkerCommand["payload"];
}

export type PortableWorkerEvent =
  | { kind: "progress"; attemptId: string; runtimeIdentity: string; loaded: number | null; total: number | null; progress: number | null; stage: "preparing" | "loading" | "checking" }
  | { kind: "ready"; attemptId: string; runtimeIdentity: string; contextLimit: number }
  | { kind: "measurement"; attemptId: string; runtimeIdentity: string; used: number; capacity: number }
  | { kind: "delta"; attemptId: string; runtimeIdentity: string; text: string }
  | { kind: "complete"; attemptId: string; runtimeIdentity: string; text: string }
  | { kind: "interrupted"; attemptId: string; runtimeIdentity: string; text: string }
  | { kind: "error"; attemptId: string; runtimeIdentity: string; code: ModelErrorCode }
  | { kind: "disposed"; attemptId: string; runtimeIdentity: string };

const COMMAND_KINDS: readonly PortableWorkerCommandKind[] = [
  "inspect",
  "prepare",
  "healthCheck",
  "measure",
  "generate",
  "interrupt",
  "dispose",
];

export function validatePortableWorkerCommand(
  command: PortableWorkerCommandInput,
): PortableWorkerCommand {
  if (command.protocolVersion !== PORTABLE_WORKER_PROTOCOL_VERSION) {
    throw new Error("protocol_version");
  }
  const kind = COMMAND_KINDS.find((candidate) => candidate === command.kind);
  if (!kind) throw new Error("command_kind");
  if (!command.attemptId || !command.runtimeIdentity || !command.payload) {
    throw new Error("command_payload");
  }
  return { ...command, kind };
}

export function isPortableWorkerEvent(event: unknown): event is PortableWorkerEvent {
  if (!event || typeof event !== "object") return false;
  const candidate = event as Partial<PortableWorkerEvent>;
  if (
    typeof candidate.attemptId !== "string" ||
    candidate.attemptId.length === 0 ||
    typeof candidate.runtimeIdentity !== "string" ||
    candidate.runtimeIdentity.length === 0
  ) return false;
  switch (candidate.kind) {
    case "progress":
      return (
        ["preparing", "loading", "checking"].includes(candidate.stage ?? "") &&
        (candidate.loaded === null || typeof candidate.loaded === "number") &&
        (candidate.total === null || typeof candidate.total === "number") &&
        (candidate.progress === null ||
          (typeof candidate.progress === "number" &&
            candidate.progress >= 0 &&
            candidate.progress <= 1))
      );
    case "ready":
      return typeof candidate.contextLimit === "number" && candidate.contextLimit > 0;
    case "measurement":
      return (
        typeof candidate.used === "number" &&
        candidate.used >= 0 &&
        typeof candidate.capacity === "number" &&
        candidate.capacity > 0
      );
    case "delta":
    case "complete":
    case "interrupted":
      return typeof candidate.text === "string";
    case "error":
      return typeof candidate.code === "string";
    case "disposed":
      return true;
    default:
      return false;
  }
}
