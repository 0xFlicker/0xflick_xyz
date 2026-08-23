import {
  PORTABLE_CONTEXT_LIMIT,
  PROMPT_VERSION,
} from "@/features/assistant/constants";
import type {
  LocalModelDescriptor,
  ModelRuntimeIdentity,
} from "@/features/assistant/types";

export interface RuntimeSurfaces {
  cacheStorage: boolean;
  nativePromptApi: boolean;
  secureContext: boolean;
  wasm: boolean;
  webgpu: boolean;
  worker: boolean;
}

export const MODEL_CATALOG: readonly LocalModelDescriptor[] = [
  {
    key: "browser-prompt-api",
    displayName: "Built-in browser model",
    executionName: "Prompt API",
    rank: 0,
    kind: "native",
    backend: "prompt-api",
    capabilities: { text: true, image: true, audio: true },
    dtype: "default",
    contextLimit: "dynamic",
    promptVersion: PROMPT_VERSION,
  },
  {
    key: "smollm2-360m-webgpu",
    displayName: "SmolLM2 360M",
    executionName: "WebGPU",
    rank: 1,
    kind: "portable",
    backend: "webgpu",
    capabilities: { text: true, image: false, audio: false },
    task: "text-generation",
    repository: "onnx-community/SmolLM2-360M-Instruct-ONNX",
    revision: "fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9",
    dtype: "q4",
    approximateWeightBytes: 386_000_000,
    contextLimit: PORTABLE_CONTEXT_LIMIT,
    promptVersion: PROMPT_VERSION,
  },
  {
    key: "smollm2-135m-wasm",
    displayName: "SmolLM2 135M",
    executionName: "WASM",
    rank: 2,
    kind: "portable",
    backend: "wasm",
    capabilities: { text: true, image: false, audio: false },
    task: "text-generation",
    repository: "onnx-community/SmolLM2-135M-Instruct-ONNX",
    revision: "b8a5c0f183b78c55955a5364f610c36668b5e681",
    dtype: "q4",
    approximateWeightBytes: 181_000_000,
    contextLimit: PORTABLE_CONTEXT_LIMIT,
    promptVersion: PROMPT_VERSION,
  },
];

export function runtimeIdentityFor(
  descriptor: LocalModelDescriptor,
): ModelRuntimeIdentity {
  return [
    descriptor.key,
    descriptor.revision ?? "native",
    descriptor.backend,
    descriptor.dtype,
    descriptor.promptVersion,
  ].join(":");
}

export function detectRuntimeSurfaces(): RuntimeSurfaces {
  return {
    cacheStorage: typeof caches !== "undefined",
    nativePromptApi: typeof LanguageModel !== "undefined",
    secureContext: typeof window !== "undefined" && window.isSecureContext,
    wasm: typeof WebAssembly !== "undefined",
    webgpu:
      typeof navigator !== "undefined" && Boolean(Reflect.get(navigator, "gpu")),
    worker: typeof Worker !== "undefined",
  };
}

export function offeredModelDescriptors(
  surfaces: RuntimeSurfaces = detectRuntimeSurfaces(),
): LocalModelDescriptor[] {
  if (!surfaces.secureContext) return [];
  return MODEL_CATALOG.filter((descriptor) => {
    if (descriptor.kind === "native") return surfaces.nativePromptApi;
    const portableBase =
      surfaces.worker && surfaces.cacheStorage && surfaces.wasm;
    if (!portableBase) return false;
    return descriptor.backend === "webgpu" ? surfaces.webgpu : true;
  });
}

export function modelDescriptor(
  key: LocalModelDescriptor["key"],
): LocalModelDescriptor | null {
  return MODEL_CATALOG.find((descriptor) => descriptor.key === key) ?? null;
}
