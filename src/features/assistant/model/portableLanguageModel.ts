import { v4 as uuid } from "uuid";

import { PORTABLE_OUTPUT_TOKEN_ALLOWANCE } from "@/features/assistant/constants";
import { ModelAdapterError } from "@/features/assistant/model/errorMapping";
import type {
  LocalModelAdapter,
  LocalModelSession,
} from "@/features/assistant/model/modelAdapter";
import { runtimeIdentityFor } from "@/features/assistant/model/modelCatalog";
import {
  PORTABLE_WORKER_PROTOCOL_VERSION,
  isPortableWorkerEvent,
  type PortableWorkerCommand,
  type PortableWorkerCommandKind,
  type PortableWorkerEvent,
} from "@/features/assistant/model/portableWorkerProtocol";
import type {
  LocalModelDescriptor,
  MediaCapability,
  MediaKind,
  ModelAvailability,
  ModelContext,
  ModelInput,
  ModelProgress,
  ModelPrompt,
} from "@/features/assistant/types";

export interface PortableWorkerLike {
  onmessage: ((event: MessageEvent<PortableWorkerEvent>) => void) | null;
  postMessage(command: PortableWorkerCommand): void;
  terminate(): void;
}

type PortableWorkerFactory = () => PortableWorkerLike;

declare global {
  interface Window {
    __FLICK_ASSISTANT_PORTABLE_WORKER_FACTORY__?: () => PortableWorkerLike;
  }
}

function defaultWorkerFactory(): PortableWorkerLike {
  if (
    typeof window !== "undefined" &&
    window.__FLICK_ASSISTANT_PORTABLE_WORKER_FACTORY__
  ) {
    return window.__FLICK_ASSISTANT_PORTABLE_WORKER_FACTORY__();
  }
  return new Worker(new URL("./portableModel.worker.ts", import.meta.url), {
    type: "module",
  });
}

function abortError(): DOMException {
  return new DOMException("The operation was aborted", "AbortError");
}

function portablePrompts(input: ModelInput): ModelPrompt[] {
  if (typeof input === "string") return [{ role: "user", content: input }];
  for (const prompt of input) {
    if (typeof prompt.content !== "string") {
      throw new ModelAdapterError("unsupported_input");
    }
  }
  return input;
}

function terminalEvent(event: PortableWorkerEvent): boolean {
  return (
    event.kind === "ready" ||
    event.kind === "measurement" ||
    event.kind === "complete" ||
    event.kind === "interrupted" ||
    event.kind === "error" ||
    event.kind === "disposed"
  );
}

class PortableWorkerClient {
  private readonly handlers = new Map<
    string,
    (event: PortableWorkerEvent) => void
  >();
  private worker: PortableWorkerLike | null = null;
  private disposed = false;

  constructor(
    private readonly descriptor: LocalModelDescriptor,
    private readonly workerFactory: PortableWorkerFactory,
  ) {}

  private currentWorker(): PortableWorkerLike {
    if (this.disposed) throw new ModelAdapterError("runtime_terminated");
    if (this.worker) return this.worker;
    const worker = this.workerFactory();
    worker.onmessage = (message) => {
      const event = message.data;
      if (!isPortableWorkerEvent(event)) {
        const pending = [...this.handlers.entries()];
        this.resetWorker();
        pending.forEach(([attemptId, handler]) => handler({
          kind: "error",
          attemptId,
          runtimeIdentity: runtimeIdentityFor(this.descriptor),
          code: "api_changed",
        }));
        return;
      }
      if (event.runtimeIdentity !== runtimeIdentityFor(this.descriptor)) {
        this.handlers.get(event.attemptId)?.({
          kind: "error",
          attemptId: event.attemptId,
          runtimeIdentity: runtimeIdentityFor(this.descriptor),
          code: "api_changed",
        });
        return;
      }
      this.handlers.get(event.attemptId)?.(event);
    };
    this.worker = worker;
    return worker;
  }

  private command(
    kind: PortableWorkerCommandKind,
    attemptId: string,
    payload: PortableWorkerCommand["payload"],
  ): PortableWorkerCommand {
    return {
      protocolVersion: PORTABLE_WORKER_PROTOCOL_VERSION,
      kind,
      attemptId,
      runtimeIdentity: runtimeIdentityFor(this.descriptor),
      payload,
    };
  }

  private modelPayload(): NonNullable<PortableWorkerCommand["payload"]["model"]> {
    const { repository, revision, backend, dtype, contextLimit } = this.descriptor;
    if (
      !repository ||
      !revision ||
      backend === "prompt-api" ||
      dtype !== "q4" ||
      typeof contextLimit !== "number"
    ) {
      throw new ModelAdapterError("unsupported_device");
    }
    return { repository, revision, backend, dtype, contextLimit };
  }

  async request(
    kind: PortableWorkerCommandKind,
    payload: PortableWorkerCommand["payload"],
    signal?: AbortSignal,
    onEvent?: (event: PortableWorkerEvent) => void,
  ): Promise<PortableWorkerEvent> {
    if (signal?.aborted) throw abortError();
    const attemptId = uuid();
    const worker = this.currentWorker();
    return new Promise<PortableWorkerEvent>((resolve, reject) => {
      const cleanup = (): void => {
        this.handlers.delete(attemptId);
        signal?.removeEventListener("abort", onAbort);
      };
      const onAbort = (): void => {
        cleanup();
        if (kind === "generate") {
          worker.postMessage(this.command("interrupt", attemptId, {}));
        } else {
          this.resetWorker();
        }
        reject(abortError());
      };
      this.handlers.set(attemptId, (event) => {
        onEvent?.(event);
        if (!terminalEvent(event)) return;
        cleanup();
        if (event.kind === "error") {
          reject(new ModelAdapterError(event.code));
        } else {
          resolve(event);
        }
      });
      signal?.addEventListener("abort", onAbort, { once: true });
      worker.postMessage(this.command(kind, attemptId, payload));
    });
  }

  async prepare(
    signal?: AbortSignal,
    onProgress?: (progress: ModelProgress) => void,
  ): Promise<number> {
    const prepared = await this.request(
      "prepare",
      { model: this.modelPayload() },
      signal,
      (event) => {
        if (event.kind !== "progress") return;
        if (event.progress === null) {
          onProgress?.({ state: "preparing" });
        } else {
          onProgress?.({ state: "downloading", fraction: event.progress });
        }
      },
    );
    if (prepared.kind !== "ready") throw new ModelAdapterError("operation_failed");
    onProgress?.({ state: "preparing" });
    const health = await this.request(
      "healthCheck",
      { model: this.modelPayload(), maxNewTokens: 8 },
      signal,
    );
    if (health.kind !== "complete" || health.text.trim().length === 0) {
      throw new ModelAdapterError("empty_response");
    }
    return prepared.contextLimit;
  }

  async measure(
    prompts: ModelPrompt[],
    signal?: AbortSignal,
  ): Promise<ModelContext> {
    const event = await this.request("measure", { prompts }, signal);
    if (event.kind !== "measurement") {
      throw new ModelAdapterError("operation_failed");
    }
    return { usage: event.used, window: event.capacity };
  }

  async *stream(
    prompts: ModelPrompt[],
    signal?: AbortSignal,
  ): AsyncIterable<string> {
    if (signal?.aborted) throw abortError();
    const attemptId = uuid();
    const worker = this.currentWorker();
    const queue: string[] = [];
    let complete = false;
    let failure: ModelAdapterError | null = null;
    let wake: (() => void) | null = null;
    const notify = (): void => {
      const pending = wake;
      wake = null;
      pending?.();
    };
    const cleanup = (): void => {
      this.handlers.delete(attemptId);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = (): void => {
      worker.postMessage(this.command("interrupt", attemptId, {}));
      notify();
    };
    this.handlers.set(attemptId, (event) => {
      if (event.kind === "delta") queue.push(event.text);
      if (event.kind === "complete" || event.kind === "interrupted") complete = true;
      if (event.kind === "error") {
        failure = new ModelAdapterError(event.code);
        complete = true;
      }
      notify();
    });
    signal?.addEventListener("abort", onAbort, { once: true });
    worker.postMessage(
      this.command("generate", attemptId, {
        prompts,
        maxNewTokens: PORTABLE_OUTPUT_TOKEN_ALLOWANCE,
      }),
    );

    try {
      while (!complete || queue.length > 0) {
        if (signal?.aborted) throw abortError();
        const text = queue.shift();
        if (text !== undefined) {
          yield text;
          continue;
        }
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
      if (failure) throw failure;
      if (signal?.aborted) throw abortError();
    } finally {
      cleanup();
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    const worker = this.worker;
    this.worker = null;
    this.handlers.clear();
    if (!worker) return;
    const attemptId = uuid();
    worker.postMessage(this.command("dispose", attemptId, {}));
    worker.terminate();
  }

  resetWorker(): void {
    const worker = this.worker;
    this.worker = null;
    this.handlers.clear();
    worker?.terminate();
  }
}

class PortableLanguageModelSession implements LocalModelSession {
  readonly modelKey;
  readonly runtimeIdentity;
  readonly capabilities;
  private destroyed = false;

  constructor(
    private readonly client: PortableWorkerClient,
    private readonly descriptor: LocalModelDescriptor,
    private readonly initialPrompts: ModelPrompt[],
    private readonly contextLimit: number,
  ) {
    this.modelKey = descriptor.key;
    this.runtimeIdentity = runtimeIdentityFor(descriptor);
    this.capabilities = descriptor.capabilities;
  }

  context(): ModelContext {
    return this.destroyed
      ? { usage: null, window: null }
      : { usage: null, window: this.contextLimit };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    void this.client.dispose();
  }

  measure(input: ModelInput, signal?: AbortSignal): Promise<ModelContext> {
    if (this.destroyed) throw new ModelAdapterError("runtime_terminated");
    return this.client.measure([...this.initialPrompts, ...portablePrompts(input)], signal);
  }

  onOverflow(): () => void {
    return () => undefined;
  }

  stream(input: ModelInput, signal?: AbortSignal): AsyncIterable<string> {
    if (this.destroyed) throw new ModelAdapterError("runtime_terminated");
    return this.client.stream([...this.initialPrompts, ...portablePrompts(input)], signal);
  }
}

export class PortableLanguageModelAdapter implements LocalModelAdapter {
  readonly runtimeIdentity;
  private client: PortableWorkerClient | null = null;
  private ready = false;

  constructor(
    readonly descriptor: LocalModelDescriptor,
    private readonly workerFactory: PortableWorkerFactory = defaultWorkerFactory,
  ) {
    if (descriptor.kind !== "portable") {
      throw new ModelAdapterError("unsupported_device");
    }
    this.runtimeIdentity = runtimeIdentityFor(descriptor);
  }

  async availability(): Promise<ModelAvailability> {
    return this.ready ? { state: "available" } : { state: "downloadable" };
  }

  async capabilities(): Promise<MediaCapability> {
    return {
      ...this.descriptor.capabilities,
      observedAt: Date.now(),
      modelIdentity: this.runtimeIdentity,
      error: null,
    };
  }

  async create(
    initialPrompts: ModelPrompt[],
    signal?: AbortSignal,
    onProgress?: (progress: ModelProgress) => void,
    mediaKinds: MediaKind[] = [],
  ): Promise<LocalModelSession> {
    if (mediaKinds.length > 0) throw new ModelAdapterError("unsupported_input");
    this.destroy();
    const client = new PortableWorkerClient(this.descriptor, this.workerFactory);
    this.client = client;
    try {
      const contextLimit = await client.prepare(signal, onProgress);
      if (this.client !== client) throw new ModelAdapterError("runtime_terminated");
      this.ready = true;
      return new PortableLanguageModelSession(
        client,
        this.descriptor,
        portablePrompts(initialPrompts),
        contextLimit,
      );
    } catch (error) {
      if (this.client === client) this.client = null;
      await client.dispose();
      this.ready = false;
      throw error;
    }
  }

  destroy(): void {
    const client = this.client;
    this.client = null;
    this.ready = false;
    void client?.dispose();
  }
}
