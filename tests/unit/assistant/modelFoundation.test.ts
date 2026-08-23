import { describe, expect, it, vi } from "vitest";

import {
  MODEL_CATALOG,
  offeredModelDescriptors,
  runtimeIdentityFor,
} from "@/features/assistant/model/modelCatalog";
import {
  PORTABLE_WORKER_PROTOCOL_VERSION,
  validatePortableWorkerCommand,
} from "@/features/assistant/model/portableWorkerProtocol";
import { ModelController } from "@/features/assistant/model/modelController";
import { ModelAssetManager, type ModelRegistryApi } from "@/features/assistant/model/modelAssets";
import { assistantReducer, initialAssistantState } from "@/features/assistant/reducer";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

describe("portable model foundation", () => {
  it("keeps stable native-first catalog identities and pinned portable runtimes", () => {
    expect(MODEL_CATALOG.map((model) => model.key)).toEqual([
      "browser-prompt-api",
      "smollm2-360m-webgpu",
      "smollm2-135m-wasm",
    ]);
    expect(MODEL_CATALOG[1]).toMatchObject({
      backend: "webgpu",
      dtype: "q4",
      repository: "onnx-community/SmolLM2-360M-Instruct-ONNX",
      revision: "fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9",
    });
    expect(MODEL_CATALOG[2]).toMatchObject({
      backend: "wasm",
      dtype: "q4",
      repository: "onnx-community/SmolLM2-135M-Instruct-ONNX",
      revision: "b8a5c0f183b78c55955a5364f610c36668b5e681",
    });
    expect(new Set(MODEL_CATALOG.map(runtimeIdentityFor)).size).toBe(3);
  });

  it("offers by structural runtime surfaces without browser or device allowlists", () => {
    expect(
      offeredModelDescriptors({
        cacheStorage: true,
        nativePromptApi: false,
        secureContext: true,
        wasm: true,
        webgpu: false,
        worker: true,
      }).map((model) => model.key),
    ).toEqual(["smollm2-135m-wasm"]);
    expect(
      offeredModelDescriptors({
        cacheStorage: true,
        nativePromptApi: true,
        secureContext: true,
        wasm: true,
        webgpu: true,
        worker: true,
      }).map((model) => model.key),
    ).toEqual(MODEL_CATALOG.map((model) => model.key));
  });

  it("fails closed on unknown worker protocol versions and payloads", () => {
    const valid = {
      protocolVersion: PORTABLE_WORKER_PROTOCOL_VERSION,
      kind: "inspect",
      attemptId: "attempt-1",
      runtimeIdentity: runtimeIdentityFor(MODEL_CATALOG[2]),
      payload: {},
    };
    expect(validatePortableWorkerCommand(valid)).toEqual(valid);
    expect(() =>
      validatePortableWorkerCommand({ ...valid, protocolVersion: 99 }),
    ).toThrow("protocol_version");
    expect(() => validatePortableWorkerCommand({ ...valid, kind: "mystery" })).toThrow(
      "command_kind",
    );
  });

  it("discovers per-option readiness and keeps active separate from pending", async () => {
    const native = createFakeModelAdapter({ descriptor: MODEL_CATALOG[0] });
    const portable = createFakeModelAdapter({
      descriptor: MODEL_CATALOG[2],
      availability: { state: "downloadable" },
    });
    const registry: ModelRegistryApi = {
      clearPipelineCache: vi.fn(),
      getFileMetadata: vi.fn().mockResolvedValue({ exists: true, size: 10 }),
      getPipelineFiles: vi.fn().mockResolvedValue(["model.onnx"]),
      isPipelineCachedFiles: vi.fn().mockResolvedValue({
        allCached: false,
        files: [{ file: "model.onnx", cached: false }],
      }),
    };
    const controller = new ModelController(
      [native.adapter, portable.adapter],
      new ModelAssetManager(registry),
    );
    const snapshot = await controller.discover();
    expect(snapshot.options.map((option) => option.descriptor.key)).toEqual([
      "browser-prompt-api",
      "smollm2-135m-wasm",
    ]);
    expect(snapshot.selectedModelKey).toBe("browser-prompt-api");

    controller.activate("browser-prompt-api");
    controller.setPending("smollm2-135m-wasm");
    expect(controller.getSnapshot()).toMatchObject({
      activeModelKey: "browser-prompt-api",
      pendingModelKey: "smollm2-135m-wasm",
    });
  });

  it("disposes a resident portable runtime before removing its exact assets", async () => {
    const portable = createFakeModelAdapter({ descriptor: MODEL_CATALOG[2] });
    const destroy = vi.fn();
    const adapter = { ...portable.adapter, destroy };
    const clearPipelineCache = vi.fn().mockResolvedValue(undefined);
    const registry: ModelRegistryApi = {
      clearPipelineCache,
      getFileMetadata: vi.fn().mockResolvedValue({ exists: false }),
      getPipelineFiles: vi.fn().mockResolvedValue(["onnx/model_q4.onnx"]),
      isPipelineCachedFiles: vi.fn().mockResolvedValue({
        allCached: false,
        files: [{ file: "onnx/model_q4.onnx", cached: false }],
      }),
    };
    const controller = new ModelController(
      [adapter],
      new ModelAssetManager(registry),
    );
    await controller.discover();
    await controller.prepare(MODEL_CATALOG[2].key, []);

    await controller.remove(MODEL_CATALOG[2].key);

    expect(destroy).toHaveBeenCalledOnce();
    expect(clearPipelineCache).toHaveBeenCalledOnce();
    expect(controller.getSnapshot().options[0]?.asset.state).toBe("unprepared");
  });

  it("reduces catalog discovery, selection, pending, and activation independently", () => {
    const option = {
      descriptor: MODEL_CATALOG[2],
      asset: {
        modelKey: MODEL_CATALOG[2].key,
        compatibility: "offered" as const,
        state: "unprepared" as const,
        requiredFiles: [],
        expectedBytes: null,
        loadedBytes: null,
        progress: null,
        loadedRuntimeIdentity: null,
        failure: null,
        observedAt: 1,
      },
      active: false,
      pending: false,
    };
    let state = assistantReducer(initialAssistantState, {
      type: "models/discovered",
      options: [option],
      selectedModelKey: option.descriptor.key,
      activeModelKey: null,
      pendingModelKey: null,
    });
    state = assistantReducer(state, { type: "models/pending", modelKey: option.descriptor.key });
    expect(state.models.options[0]).toMatchObject({ active: false, pending: true });
    state = assistantReducer(state, { type: "models/activate", modelKey: option.descriptor.key });
    expect(state.models.options[0]).toMatchObject({ active: true, pending: false });
  });
});
