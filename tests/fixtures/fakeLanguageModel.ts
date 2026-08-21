import type {
  LocalModelAdapter,
  LocalModelSession,
} from "@/features/assistant/model/modelAdapter";
import type {
  MediaCapability,
  ModelAvailability,
  ModelContext,
  ModelErrorCode,
  ModelInput,
  ModelProgress,
  ModelPrompt,
} from "@/features/assistant/types";

export interface FakeModelScenario {
  availability?: ModelAvailability;
  capabilities?: Partial<Pick<MediaCapability, "text" | "image" | "audio">>;
  chunks?: string[];
  context?: ModelContext;
  createError?: ModelErrorCode;
  delayMs?: number;
  createDelayMs?: number;
  progress?: number[];
  streamError?: ModelErrorCode;
  overflowAfterChunk?: number;
}

function abortError(): DOMException {
  return new DOMException("The operation was aborted", "AbortError");
}

function scenarioError(code: ModelErrorCode): Error {
  return Object.assign(new Error(code), { code });
}

async function wait(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw abortError();
  if (delayMs === 0) return;

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, delayMs);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

class FakeSession implements LocalModelSession {
  private destroyed = false;
  private readonly overflowListeners = new Set<() => void>();

  constructor(
    private readonly scenario: Required<
      Pick<FakeModelScenario, "chunks" | "context" | "delayMs" | "createDelayMs">
    > &
      FakeModelScenario,
    private readonly onDestroy: () => void,
    private readonly captureInput: (input: ModelInput) => void,
  ) {}

  context(): ModelContext {
    return this.scenario.context;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.onDestroy();
  }

  async measure(input: ModelInput, signal?: AbortSignal): Promise<ModelContext> {
    if (this.destroyed) throw scenarioError("operation_failed");
    if (signal?.aborted) throw abortError();
    this.captureInput(input);
    return this.scenario.context;
  }

  onOverflow(listener: () => void): () => void {
    this.overflowListeners.add(listener);
    return () => this.overflowListeners.delete(listener);
  }

  async *stream(input: ModelInput, signal?: AbortSignal): AsyncIterable<string> {
    if (this.destroyed) throw scenarioError("operation_failed");
    this.captureInput(input);

    for (const [index, chunk] of this.scenario.chunks.entries()) {
      await wait(this.scenario.delayMs, signal);
      if (this.destroyed) return;
      yield chunk;
      if (this.scenario.overflowAfterChunk === index + 1) {
        this.overflowListeners.forEach((listener) => listener());
      }
    }

    if (this.scenario.streamError) throw scenarioError(this.scenario.streamError);
  }
}

export function createFakeModelAdapter(scenario: FakeModelScenario = {}): {
  adapter: LocalModelAdapter;
  createdPrompts: ModelPrompt[][];
  capturedInputs: ModelInput[];
  lifecycle: { created: number; destroyed: number };
} {
  const resolved = {
    availability: scenario.availability ?? ({ state: "available" } as const),
    chunks: scenario.chunks ?? ["A local response."],
    context: scenario.context ?? { usage: 12, window: 1_024 },
    delayMs: scenario.delayMs ?? 0,
    createDelayMs: scenario.createDelayMs ?? 0,
    ...scenario,
  };
  const lifecycle = { created: 0, destroyed: 0 };
  const createdPrompts: ModelPrompt[][] = [];
  const capturedInputs: ModelInput[] = [];
  let currentAvailability = resolved.availability;
  const capabilities = {
    text: scenario.capabilities?.text ?? true,
    image: scenario.capabilities?.image ?? false,
    audio: scenario.capabilities?.audio ?? false,
  };

  const adapter: LocalModelAdapter = {
    availability: async () => currentAvailability,
    capabilities: async () => ({
      ...capabilities,
      observedAt: Date.now(),
      modelIdentity: "fake",
      error: capabilities.text ? null : "media_unavailable",
    }),
    create: async (initialPrompts, signal, onProgress) => {
      if (signal?.aborted) throw abortError();
      if (resolved.createError) throw scenarioError(resolved.createError);

      for (const fraction of resolved.progress ?? []) {
        const progress: ModelProgress =
          fraction >= 1
            ? { state: "preparing" }
            : { state: "downloading", fraction };
        onProgress?.(progress);
      }

      await wait(resolved.createDelayMs, signal);

      lifecycle.created += 1;
      if (
        currentAvailability.state === "downloadable" ||
        currentAvailability.state === "downloading"
      ) {
        currentAvailability = { state: "available" };
      }
      createdPrompts.push(initialPrompts);
      return new FakeSession(
        resolved,
        () => {
          lifecycle.destroyed += 1;
        },
        (input) => capturedInputs.push(input),
      );
    },
  };

  return { adapter, createdPrompts, capturedInputs, lifecycle };
}
