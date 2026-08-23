import type {
  MediaCapability,
  MediaKind,
  ModelAvailability,
  ModelContext,
  ModelInput,
  ModelProgress,
  ModelPrompt,
  LocalModelDescriptor,
  LocalModelCapabilities,
  ModelRuntimeIdentity,
} from "@/features/assistant/types";

export interface LocalModelSession {
  readonly modelKey: LocalModelDescriptor["key"];
  readonly runtimeIdentity: ModelRuntimeIdentity;
  readonly capabilities: LocalModelCapabilities;
  context(): ModelContext;
  destroy(): void;
  measure(input: ModelInput, signal?: AbortSignal): Promise<ModelContext>;
  onOverflow(listener: () => void): () => void;
  stream(input: ModelInput, signal?: AbortSignal): AsyncIterable<string>;
}

export interface LocalModelAdapter {
  readonly descriptor: LocalModelDescriptor;
  readonly runtimeIdentity: ModelRuntimeIdentity;
  availability(): Promise<ModelAvailability>;
  capabilities?: () => Promise<MediaCapability>;
  create(
    initialPrompts: ModelPrompt[],
    signal?: AbortSignal,
    onProgress?: (progress: ModelProgress) => void,
    mediaKinds?: MediaKind[],
  ): Promise<LocalModelSession>;
  destroy?(): void;
}
