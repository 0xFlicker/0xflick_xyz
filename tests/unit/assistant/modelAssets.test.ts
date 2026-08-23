import { afterEach, describe, expect, it, vi } from "vitest";

import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";
import {
  ModelAssetManager,
  type ModelRegistryApi,
} from "@/features/assistant/model/modelAssets";

function registry(overrides: Partial<ModelRegistryApi> = {}): ModelRegistryApi {
  return {
    clearPipelineCache: vi.fn().mockResolvedValue(undefined),
    getFileMetadata: vi.fn(async (_repository, file) => ({
      exists: true,
      size: file.endsWith(".onnx") ? 100 : 10,
    })),
    getPipelineFiles: vi.fn().mockResolvedValue([
      "config.json",
      "tokenizer.json",
      "onnx/model_q4.onnx",
    ]),
    isPipelineCachedFiles: vi.fn().mockResolvedValue({
      allCached: false,
      files: [
        { file: "config.json", cached: true },
        { file: "tokenizer.json", cached: false },
        { file: "onnx/model_q4.onnx", cached: false },
      ],
    }),
    ...overrides,
  };
}

describe("ModelAssetManager", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("enumerates pinned files, totals metadata, and distinguishes partial cache from readiness", async () => {
    const api = registry();
    const manager = new ModelAssetManager(api);
    const snapshot = await manager.inspect(MODEL_CATALOG[2]);

    expect(api.getPipelineFiles).toHaveBeenCalledWith(
      "text-generation",
      "onnx-community/SmolLM2-135M-Instruct-ONNX",
      expect.objectContaining({ dtype: "q4", revision: MODEL_CATALOG[2].revision }),
    );
    expect(snapshot.expectedBytes).toBe(120);
    expect(snapshot.state).toBe("unprepared");
    expect(snapshot.requiredFiles.map((file) => file.cached)).toEqual([true, false, false]);
  });

  it("reports externally evicted assets and removes only the selected pinned pipeline", async () => {
    const clearPipelineCache = vi.fn().mockResolvedValue(undefined);
    const api = registry({
      clearPipelineCache,
      isPipelineCachedFiles: vi.fn().mockResolvedValue({
        allCached: false,
        files: [{ file: "config.json", cached: false }],
      }),
    });
    const manager = new ModelAssetManager(api);

    await manager.remove(MODEL_CATALOG[2]);

    expect(clearPipelineCache).toHaveBeenCalledWith(
      "text-generation",
      MODEL_CATALOG[2].repository,
      expect.objectContaining({ dtype: "q4", revision: MODEL_CATALOG[2].revision }),
    );
    expect((await manager.inspect(MODEL_CATALOG[2])).state).toBe("unprepared");
  });

  it("preserves another prepared pipeline and publishes only an invalidation notice", async () => {
    const posted: unknown[] = [];
    class FakeBroadcastChannel {
      onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
      close = vi.fn();
      postMessage(value: unknown) { posted.push(value); }
    }
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
    const clearPipelineCache = vi.fn().mockResolvedValue(undefined);
    const api = registry({
      clearPipelineCache,
      isPipelineCachedFiles: vi.fn().mockResolvedValue({
        allCached: true,
        files: [
          { file: "config.json", cached: true },
          { file: "tokenizer.json", cached: true },
          { file: "onnx/model_q4.onnx", cached: true },
        ],
      }),
    });
    const manager = new ModelAssetManager(api);
    manager.markReady(MODEL_CATALOG[1]);
    manager.markReady(MODEL_CATALOG[2]);

    await manager.remove(MODEL_CATALOG[2]);

    expect(clearPipelineCache).toHaveBeenCalledOnce();
    expect(clearPipelineCache).toHaveBeenCalledWith(
      "text-generation",
      MODEL_CATALOG[2].repository,
      expect.objectContaining({ revision: MODEL_CATALOG[2].revision }),
    );
    expect((await manager.inspect(MODEL_CATALOG[1])).state).toBe("ready");
    expect(posted).toEqual([{
      kind: "invalidated",
      modelKey: MODEL_CATALOG[2].key,
    }]);
  });

  it("never equates complete cached files with local readiness until health-check success", async () => {
    const api = registry({
      isPipelineCachedFiles: vi.fn().mockResolvedValue({
        allCached: true,
        files: [
          { file: "config.json", cached: true },
          { file: "tokenizer.json", cached: true },
          { file: "onnx/model_q4.onnx", cached: true },
        ],
      }),
    });
    const manager = new ModelAssetManager(api);
    expect((await manager.inspect(MODEL_CATALOG[2])).state).toBe("unprepared");
    manager.markReady(MODEL_CATALOG[2]);
    expect((await manager.inspect(MODEL_CATALOG[2])).state).toBe("ready");
    manager.markUnavailable(MODEL_CATALOG[2]);
    expect((await manager.inspect(MODEL_CATALOG[2])).state).toBe("unprepared");
  });

  it("serializes model-specific work and treats persistence denial as nonfatal", async () => {
    const requests: string[] = [];
    vi.stubGlobal("navigator", {
      locks: {
        request: async (name: string, _options: object, work: () => Promise<unknown>) => {
          requests.push(name);
          return work();
        },
      },
      storage: { persist: vi.fn().mockResolvedValue(false) },
    });
    const manager = new ModelAssetManager(registry());
    await expect(manager.runExclusive(MODEL_CATALOG[2], async () => "done")).resolves.toBe("done");
    expect(requests[0]).toContain("smollm2-135m-wasm");
    await expect(manager.requestPersistentStorage()).resolves.toBe(false);
  });
});
