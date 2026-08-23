import {
  MODEL_ASSET_BROADCAST_CHANNEL,
  MODEL_ASSET_CACHE_NAME,
  MODEL_ASSET_LOCK_PREFIX,
} from "@/features/assistant/constants";
import { runtimeIdentityFor } from "@/features/assistant/model/modelCatalog";
import type {
  LocalModelDescriptor,
  ModelAssetSnapshot,
} from "@/features/assistant/types";

interface PipelineOptions {
  cache_dir: string;
  device: "webgpu" | "wasm";
  dtype: "q4";
  revision: string;
}

interface RegistryCacheFile {
  file: string;
  cached: boolean;
}

interface RegistryCacheResult {
  allCached: boolean;
  files: RegistryCacheFile[];
}

export interface ModelRegistryApi {
  clearPipelineCache(
    task: string,
    repository: string,
    options: PipelineOptions,
  ): Promise<object | void>;
  getFileMetadata(
    repository: string,
    file: string,
    options: PipelineOptions,
  ): Promise<{ exists: boolean; size?: number }>;
  getPipelineFiles(
    task: string,
    repository: string,
    options: PipelineOptions,
  ): Promise<string[]>;
  isPipelineCachedFiles(
    task: string,
    repository: string,
    options: PipelineOptions,
  ): Promise<RegistryCacheResult>;
}

declare global {
  interface Window {
    __FLICK_ASSISTANT_MODEL_REGISTRY__?: ModelRegistryApi;
  }
}

const transformerRegistry: ModelRegistryApi = {
  clearPipelineCache: async (task, repository, options) => {
    const { ModelRegistry } = await import("@huggingface/transformers");
    return ModelRegistry.clear_pipeline_cache(task, repository, options);
  },
  getFileMetadata: async (repository, file, options) => {
    const { ModelRegistry } = await import("@huggingface/transformers");
    return ModelRegistry.get_file_metadata(repository, file, options);
  },
  getPipelineFiles: async (task, repository, options) => {
    const { ModelRegistry } = await import("@huggingface/transformers");
    return ModelRegistry.get_pipeline_files(task, repository, options);
  },
  isPipelineCachedFiles: async (task, repository, options) => {
    const { ModelRegistry } = await import("@huggingface/transformers");
    return ModelRegistry.is_pipeline_cached_files(task, repository, options);
  },
};

function defaultRegistry(): ModelRegistryApi {
  if (
    typeof window !== "undefined" &&
    window.__FLICK_ASSISTANT_MODEL_REGISTRY__
  ) {
    return window.__FLICK_ASSISTANT_MODEL_REGISTRY__;
  }
  return transformerRegistry;
}

function portableDetails(descriptor: LocalModelDescriptor): {
  repository: string;
  revision: string;
  task: "text-generation";
  options: PipelineOptions;
} {
  if (
    descriptor.kind !== "portable" ||
    !descriptor.repository ||
    !descriptor.revision ||
    !descriptor.task ||
    descriptor.dtype !== "q4" ||
    descriptor.backend === "prompt-api"
  ) {
    throw new Error("unsupported_device");
  }
  return {
    repository: descriptor.repository,
    revision: descriptor.revision,
    task: descriptor.task,
    options: {
      cache_dir: MODEL_ASSET_CACHE_NAME,
      device: descriptor.backend,
      dtype: descriptor.dtype,
      revision: descriptor.revision,
    },
  };
}

async function withModelLock<Value>(
  modelKey: LocalModelDescriptor["key"],
  work: () => Promise<Value>,
): Promise<Value> {
  if (typeof navigator === "undefined" || !navigator.locks) return work();
  return navigator.locks.request(
    `${MODEL_ASSET_LOCK_PREFIX}${modelKey}`,
    { mode: "exclusive" },
    work,
  );
}

export class ModelAssetManager {
  private readonly ready = new Set<LocalModelDescriptor["key"]>();

  constructor(private readonly registry: ModelRegistryApi = defaultRegistry()) {}

  runExclusive<Value>(
    descriptor: LocalModelDescriptor,
    work: () => Promise<Value>,
  ): Promise<Value> {
    return withModelLock(descriptor.key, work);
  }

  subscribeInvalidation(
    listener: (modelKey: LocalModelDescriptor["key"]) => void,
  ): () => void {
    if (typeof BroadcastChannel === "undefined") return () => undefined;
    const channel = new BroadcastChannel(MODEL_ASSET_BROADCAST_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!event.data || typeof event.data !== "object") return;
      const kind = Reflect.get(event.data, "kind");
      const modelKey = Reflect.get(event.data, "modelKey");
      if (kind === "invalidated" && typeof modelKey === "string") {
        listener(modelKey as LocalModelDescriptor["key"]);
      }
    };
    return () => channel.close();
  }

  async inspect(descriptor: LocalModelDescriptor): Promise<ModelAssetSnapshot> {
    const { repository, task, options } = portableDetails(descriptor);
    const [paths, cache] = await Promise.all([
      this.registry.getPipelineFiles(task, repository, options),
      this.registry.isPipelineCachedFiles(task, repository, options),
    ]);
    const cacheByPath = new Map(cache.files.map((file) => [file.file, file.cached]));
    const metadata = await Promise.all(
      paths.map((path) => this.registry.getFileMetadata(repository, path, options)),
    );
    const requiredFiles = paths.map((path, index) => ({
      path,
      size: metadata[index]?.size ?? null,
      cached: cacheByPath.get(path) ?? false,
    }));
    const knownSizes = requiredFiles
      .map((file) => file.size)
      .filter((size): size is number => size !== null);
    const expectedBytes =
      knownSizes.length === requiredFiles.length
        ? knownSizes.reduce((total, size) => total + size, 0)
        : null;
    const loadedBytes = requiredFiles.reduce(
      (total, file) => total + (file.cached ? file.size ?? 0 : 0),
      0,
    );
    const allCached = cache.allCached && requiredFiles.every((file) => file.cached);
    if (!allCached) this.ready.delete(descriptor.key);
    const state = allCached && this.ready.has(descriptor.key) ? "ready" : "unprepared";
    return {
      modelKey: descriptor.key,
      compatibility: "offered",
      state,
      requiredFiles,
      expectedBytes,
      loadedBytes,
      progress:
        expectedBytes !== null && expectedBytes > 0
          ? loadedBytes / expectedBytes
          : null,
      loadedRuntimeIdentity: state === "ready" ? runtimeIdentityFor(descriptor) : null,
      failure: null,
      observedAt: Date.now(),
    };
  }

  markReady(descriptor: LocalModelDescriptor): void {
    this.ready.add(descriptor.key);
  }

  markUnavailable(descriptor: LocalModelDescriptor): void {
    this.ready.delete(descriptor.key);
  }

  async remove(descriptor: LocalModelDescriptor): Promise<ModelAssetSnapshot> {
    return withModelLock(descriptor.key, async () => {
      const { repository, task, options } = portableDetails(descriptor);
      this.ready.delete(descriptor.key);
      await this.registry.clearPipelineCache(task, repository, options);
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel(MODEL_ASSET_BROADCAST_CHANNEL);
        channel.postMessage({ kind: "invalidated", modelKey: descriptor.key });
        channel.close();
      }
      return this.inspect(descriptor);
    });
  }

  async requestPersistentStorage(): Promise<boolean | null> {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return null;
    return navigator.storage.persist();
  }
}
