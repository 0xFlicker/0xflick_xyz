import {
  env,
  InterruptableStoppingCriteria,
  pipeline,
  TextStreamer,
  type TextGenerationPipeline,
} from "@huggingface/transformers";

import { MODEL_ASSET_CACHE_NAME } from "@/features/assistant/constants";
import { normalizeModelError } from "@/features/assistant/model/errorMapping";
import {
  type PortableWorkerCommand,
  type PortableWorkerEvent,
  validatePortableWorkerCommand,
} from "@/features/assistant/model/portableWorkerProtocol";
import type { ModelErrorCode, ModelPrompt } from "@/features/assistant/types";

const HEALTH_CHECK_PROMPTS: ModelPrompt[] = [
  { role: "system", content: "Reply with one short word." },
  { role: "user", content: "Ready?" },
];

if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;

let generator: TextGenerationPipeline | null = null;
let runtimeIdentity: string | null = null;
let contextLimit = 8_192;
let activeGeneration: {
  attemptId: string;
  stoppingCriteria: InterruptableStoppingCriteria;
  text: string;
} | null = null;
let sequence = Promise.resolve();

function post(event: PortableWorkerEvent): void {
  Reflect.apply(globalThis.postMessage, globalThis, [event]);
}

function safeError(error: unknown): ModelErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("out of memory") || message.includes("allocation")) {
      return "resource_exhausted";
    }
    if (message.includes("unsupported") || message.includes("operator")) {
      return "unsupported_device";
    }
    if (message.includes("protobuf") || message.includes("invalid model")) {
      return "corrupt_assets";
    }
  }
  return normalizeModelError(error);
}

function textChat(prompts: ModelPrompt[]): Array<{
  role: "system" | "user" | "assistant";
  content: string;
}> {
  return prompts.map((prompt) => {
    if (typeof prompt.content !== "string") throw new Error("unsupported_input");
    return { role: prompt.role, content: prompt.content };
  });
}

function requireGenerator(command: PortableWorkerCommand): TextGenerationPipeline {
  if (!generator || runtimeIdentity !== command.runtimeIdentity) {
    throw new Error("runtime_terminated");
  }
  return generator;
}

async function prepare(command: PortableWorkerCommand): Promise<void> {
  const model = command.payload.model;
  if (!model) throw new Error("command_payload");
  if (generator) await generator.dispose();
  generator = null;
  runtimeIdentity = null;
  contextLimit = model.contextLimit;
  post({
    kind: "progress",
    attemptId: command.attemptId,
    runtimeIdentity: command.runtimeIdentity,
    loaded: null,
    total: null,
    progress: null,
    stage: "preparing",
  });
  const loaded = await pipeline("text-generation", model.repository, {
    cache_dir: MODEL_ASSET_CACHE_NAME,
    revision: model.revision,
    device: model.backend,
    dtype: model.dtype,
    progress_callback(progress) {
      if (progress.status !== "progress_total") return;
      post({
        kind: "progress",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        loaded: progress.loaded,
        total: progress.total,
        progress: progress.total > 0 ? progress.loaded / progress.total : null,
        stage: "loading",
      });
    },
  });
  generator = loaded;
  runtimeIdentity = command.runtimeIdentity;
  const loadedLimit = loaded.model.config.max_position_embeddings;
  if (Number.isFinite(loadedLimit) && loadedLimit > 0) contextLimit = loadedLimit;
  post({
    kind: "ready",
    attemptId: command.attemptId,
    runtimeIdentity: command.runtimeIdentity,
    contextLimit,
  });
}

function measure(command: PortableWorkerCommand): void {
  const loaded = requireGenerator(command);
  const prompts = command.payload.prompts;
  if (!prompts) throw new Error("command_payload");
  const tokenIds = loaded.tokenizer.apply_chat_template(textChat(prompts), {
    add_generation_prompt: true,
    tokenize: true,
    return_dict: false,
    return_tensor: false,
  });
  const used = Array.isArray(tokenIds[0]) ? tokenIds[0].length : tokenIds.length;
  post({
    kind: "measurement",
    attemptId: command.attemptId,
    runtimeIdentity: command.runtimeIdentity,
    used,
    capacity: contextLimit,
  });
}

async function generate(
  command: PortableWorkerCommand,
  prompts: ModelPrompt[],
): Promise<{ interrupted: boolean; text: string }> {
  const loaded = requireGenerator(command);
  const stoppingCriteria = new InterruptableStoppingCriteria();
  const active = { attemptId: command.attemptId, stoppingCriteria, text: "" };
  activeGeneration = active;
  const streamer = new TextStreamer(loaded.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function(delta) {
      if (activeGeneration !== active) return;
      active.text += delta;
      post({
        kind: "delta",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        text: active.text,
      });
    },
  });
  await loaded(textChat(prompts), {
    max_new_tokens: command.payload.maxNewTokens ?? 256,
    do_sample: false,
    return_full_text: false,
    streamer,
    stopping_criteria: [stoppingCriteria],
  });
  if (activeGeneration === active) activeGeneration = null;
  return { interrupted: stoppingCriteria.interrupted, text: active.text };
}

async function handle(command: PortableWorkerCommand): Promise<void> {
  switch (command.kind) {
    case "prepare":
      await prepare(command);
      return;
    case "inspect":
      post({
        kind: "ready",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        contextLimit,
      });
      return;
    case "healthCheck": {
      post({
        kind: "progress",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        loaded: null,
        total: null,
        progress: null,
        stage: "checking",
      });
      const result = await generate(command, HEALTH_CHECK_PROMPTS);
      post({
        kind: "complete",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        text: result.text,
      });
      return;
    }
    case "measure":
      measure(command);
      return;
    case "generate": {
      const prompts = command.payload.prompts;
      if (!prompts) throw new Error("command_payload");
      const result = await generate(command, prompts);
      post({
        kind: result.interrupted ? "interrupted" : "complete",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        text: result.text,
      });
      return;
    }
    case "interrupt":
      if (activeGeneration?.attemptId === command.attemptId) {
        activeGeneration.stoppingCriteria.interrupt();
      }
      return;
    case "dispose":
      activeGeneration?.stoppingCriteria.interrupt();
      activeGeneration = null;
      await generator?.dispose();
      generator = null;
      runtimeIdentity = null;
      post({
        kind: "disposed",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
      });
      return;
  }
}

globalThis.addEventListener("message", (message) => {
  if (!(message instanceof MessageEvent)) return;
  let command: PortableWorkerCommand;
  try {
    command = validatePortableWorkerCommand(message.data);
  } catch (error) {
    const data = message.data;
    const attemptId = data && typeof data === "object"
      ? Reflect.get(data, "attemptId")
      : null;
    const receivedRuntimeIdentity = data && typeof data === "object"
      ? Reflect.get(data, "runtimeIdentity")
      : null;
    post({
      kind: "error",
      attemptId: typeof attemptId === "string" && attemptId ? attemptId : "invalid",
      runtimeIdentity:
        typeof receivedRuntimeIdentity === "string" && receivedRuntimeIdentity
          ? receivedRuntimeIdentity
          : "invalid",
      code: safeError(error),
    });
    return;
  }
  if (command.kind === "interrupt") {
    void handle(command).catch((error) => {
      post({
        kind: "error",
        attemptId: command.attemptId,
        runtimeIdentity: command.runtimeIdentity,
        code: safeError(error),
      });
    });
    return;
  }
  sequence = sequence.then(() => handle(command)).catch((error) => {
    post({
      kind: "error",
      attemptId: command.attemptId,
      runtimeIdentity: command.runtimeIdentity,
      code: safeError(error),
    });
  });
});

export {};
