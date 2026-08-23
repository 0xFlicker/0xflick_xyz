import type {
  LocalModelAdapter,
  LocalModelSession,
} from "@/features/assistant/model/modelAdapter";
import { ModelAssetManager } from "@/features/assistant/model/modelAssets";
import { BrowserLanguageModelAdapter } from "@/features/assistant/model/browserLanguageModel";
import {
  offeredModelDescriptors,
  runtimeIdentityFor,
} from "@/features/assistant/model/modelCatalog";
import { normalizeModelError } from "@/features/assistant/model/errorMapping";
import { PortableLanguageModelAdapter } from "@/features/assistant/model/portableLanguageModel";
import type {
  LocalModelDescriptor,
  LocalModelOption,
  ModelAssetSnapshot,
  ModelKey,
  ModelProgress,
  ModelPrompt,
} from "@/features/assistant/types";

export interface ModelControllerSnapshot {
  options: LocalModelOption[];
  selectedModelKey: ModelKey | null;
  activeModelKey: ModelKey | null;
  pendingModelKey: ModelKey | null;
}

type Listener = (snapshot: ModelControllerSnapshot) => void;

function blankAsset(
  descriptor: LocalModelDescriptor,
  state: ModelAssetSnapshot["state"] = "unprepared",
): ModelAssetSnapshot {
  return {
    modelKey: descriptor.key,
    compatibility: "offered",
    state,
    requiredFiles: [],
    expectedBytes: descriptor.approximateWeightBytes ?? null,
    loadedBytes: null,
    progress: null,
    loadedRuntimeIdentity: state === "ready" ? runtimeIdentityFor(descriptor) : null,
    failure: null,
    observedAt: Date.now(),
  };
}

function availabilityState(state: "available" | "downloadable" | "downloading" | "unavailable"):
  ModelAssetSnapshot["state"] {
  switch (state) {
    case "available":
      return "ready";
    case "downloadable":
      return "unprepared";
    case "downloading":
      return "preparing";
    case "unavailable":
      return "failed";
  }
}

export class ModelController {
  private readonly adapters = new Map<ModelKey, LocalModelAdapter>();
  private readonly listeners = new Set<Listener>();
  private snapshot: ModelControllerSnapshot = {
    options: [],
    selectedModelKey: null,
    activeModelKey: null,
    pendingModelKey: null,
  };

  constructor(
    adapters: LocalModelAdapter[] | null = null,
    private readonly assets = new ModelAssetManager(),
  ) {
    if (adapters) {
      adapters.forEach((adapter) => this.adapters.set(adapter.descriptor.key, adapter));
      return;
    }
    for (const descriptor of offeredModelDescriptors()) {
      const adapter =
        descriptor.kind === "native"
          ? new BrowserLanguageModelAdapter()
          : new PortableLanguageModelAdapter(descriptor);
      this.adapters.set(descriptor.key, adapter);
    }
  }

  getSnapshot(): ModelControllerSnapshot {
    return {
      ...this.snapshot,
      options: this.snapshot.options.map((option) => ({
        ...option,
        asset: { ...option.asset, requiredFiles: [...option.asset.requiredFiles] },
      })),
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  async discover(): Promise<ModelControllerSnapshot> {
    const discovered = await Promise.all(
      [...this.adapters.values()].map(async (adapter): Promise<LocalModelOption | null> => {
        const descriptor = adapter.descriptor;
        try {
          if (descriptor.kind === "native") {
            const availability = await adapter.availability();
            if (availability.state === "unavailable") return null;
            return {
              descriptor,
              asset: blankAsset(descriptor, availabilityState(availability.state)),
              active: false,
              pending: false,
            };
          }
          const prior = this.snapshot.options.find(
            (option) => option.descriptor.key === descriptor.key,
          )?.asset;
          // Catalog discovery is content-free and must not cause artifact metadata
          // requests. Exact pinned-file inspection begins only after visitor consent.
          const asset = prior?.state === "ready" ? prior : blankAsset(descriptor);
          return { descriptor, asset, active: false, pending: false };
        } catch (error) {
          return {
            descriptor,
            asset: {
              ...blankAsset(descriptor, "failed"),
              failure: normalizeModelError(error),
            },
            active: false,
            pending: false,
          };
        }
      }),
    );
    const options = discovered
      .filter((option): option is LocalModelOption => option !== null)
      .sort((left, right) => left.descriptor.rank - right.descriptor.rank);
    const selectedModelKey =
      this.snapshot.selectedModelKey &&
      options.some((option) => option.descriptor.key === this.snapshot.selectedModelKey)
        ? this.snapshot.selectedModelKey
        : options[0]?.descriptor.key ?? null;
    this.snapshot = { ...this.snapshot, options, selectedModelKey };
    this.publish();
    return this.getSnapshot();
  }

  adapterFor(modelKey: ModelKey): LocalModelAdapter | null {
    return this.adapters.get(modelKey) ?? null;
  }

  select(modelKey: ModelKey): void {
    if (!this.adapters.has(modelKey)) return;
    this.snapshot = { ...this.snapshot, selectedModelKey: modelKey };
    this.publish();
  }

  activate(modelKey: ModelKey): void {
    this.snapshot = {
      ...this.snapshot,
      selectedModelKey: modelKey,
      activeModelKey: modelKey,
      pendingModelKey: null,
      options: this.snapshot.options.map((option) => ({
        ...option,
        active: option.descriptor.key === modelKey,
        pending: false,
      })),
    };
    this.publish();
  }

  chooseDraft(modelKey: ModelKey): void {
    const option = this.snapshot.options.find(
      (candidate) => candidate.descriptor.key === modelKey,
    );
    if (!option) return;
    const activeModelKey = option.asset.state === "ready" ? modelKey : null;
    this.snapshot = {
      ...this.snapshot,
      selectedModelKey: modelKey,
      activeModelKey,
      pendingModelKey: null,
      options: this.snapshot.options.map((candidate) => ({
        ...candidate,
        active: candidate.descriptor.key === activeModelKey,
        pending: false,
      })),
    };
    this.publish();
  }

  setPending(modelKey: ModelKey | null): void {
    this.snapshot = {
      ...this.snapshot,
      pendingModelKey: modelKey,
      options: this.snapshot.options.map((option) => ({
        ...option,
        pending: option.descriptor.key === modelKey,
      })),
    };
    this.publish();
  }

  async prepare(
    modelKey: ModelKey,
    prompts: ModelPrompt[],
    signal?: AbortSignal,
    onProgress?: (progress: ModelProgress) => void,
  ): Promise<LocalModelSession> {
    const adapter = this.adapters.get(modelKey);
    if (!adapter) throw new Error("model_unavailable");
    this.updateAsset(modelKey, { state: "preparing", failure: null, progress: null });
    try {
      if (adapter.descriptor.kind === "portable") {
        await this.assets.requestPersistentStorage();
      }
      const session = await this.assets.runExclusive(adapter.descriptor, () =>
        adapter.create(prompts, signal, (progress) => {
          this.updateAsset(modelKey, {
            state: progress.state === "preparing" ? "checking" : "preparing",
            progress: progress.state === "downloading" ? progress.fraction : null,
          });
          onProgress?.(progress);
        }),
      );
      if (adapter.descriptor.kind === "portable") this.assets.markReady(adapter.descriptor);
      this.updateAsset(modelKey, {
        state: "ready",
        loadedRuntimeIdentity: adapter.runtimeIdentity,
        progress: 1,
      });
      return session;
    } catch (error) {
      this.updateAsset(modelKey, {
        state: signal?.aborted ? "unprepared" : "failed",
        failure: signal?.aborted ? "aborted" : normalizeModelError(error),
        progress: null,
      });
      throw error;
    }
  }

  stopWaiting(modelKey: ModelKey): void {
    const adapter = this.adapters.get(modelKey);
    adapter?.destroy?.();
    this.updateAsset(modelKey, { state: "unprepared", failure: "aborted", progress: null });
    if (adapter?.descriptor.kind === "portable") {
      void this.assets.inspect(adapter.descriptor).then(
        (asset) => this.updateAsset(modelKey, { ...asset, failure: "aborted" }),
        () => undefined,
      );
    }
  }

  async remove(modelKey: ModelKey): Promise<ModelAssetSnapshot> {
    const adapter = this.adapters.get(modelKey);
    if (!adapter || adapter.descriptor.kind !== "portable") {
      throw new Error("model_unavailable");
    }
    adapter.destroy?.();
    this.updateAsset(modelKey, { state: "removing", failure: null, progress: null });
    let snapshot: ModelAssetSnapshot;
    try {
      snapshot = await this.assets.remove(adapter.descriptor);
      this.updateAsset(modelKey, snapshot);
    } catch (error) {
      this.updateAsset(modelKey, {
        state: "failed",
        failure: normalizeModelError(error),
        progress: null,
      });
      throw error;
    }
    if (this.snapshot.activeModelKey === modelKey) {
      this.snapshot = {
        ...this.snapshot,
        activeModelKey: null,
        options: this.snapshot.options.map((option) => ({
          ...option,
          active: false,
        })),
      };
      this.publish();
    }
    return snapshot;
  }

  observeAssetInvalidation(): () => void {
    return this.assets.subscribeInvalidation((modelKey) => {
      const option = this.snapshot.options.find(
        (candidate) => candidate.descriptor.key === modelKey,
      );
      if (!option || option.descriptor.kind !== "portable") return;
      this.adapters.get(modelKey)?.destroy?.();
      void this.assets.inspect(option.descriptor).then((asset) => {
        this.updateAsset(modelKey, asset);
      });
    });
  }

  destroy(): void {
    this.adapters.forEach((adapter) => adapter.destroy?.());
    this.listeners.clear();
  }

  private updateAsset(
    modelKey: ModelKey,
    patch: Partial<ModelAssetSnapshot>,
  ): void {
    this.snapshot = {
      ...this.snapshot,
      options: this.snapshot.options.map((option) =>
        option.descriptor.key === modelKey
          ? { ...option, asset: { ...option.asset, ...patch, observedAt: Date.now() } }
          : option,
      ),
    };
    this.publish();
  }

  private publish(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
