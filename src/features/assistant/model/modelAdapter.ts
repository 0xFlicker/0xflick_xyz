import type {
  MediaCapability,
  MediaKind,
  ModelAvailability,
  ModelContext,
  ModelInput,
  ModelProgress,
  ModelPrompt,
} from "@/features/assistant/types";

export interface LocalModelSession {
  context(): ModelContext;
  destroy(): void;
  measure(input: ModelInput, signal?: AbortSignal): Promise<ModelContext>;
  onOverflow(listener: () => void): () => void;
  stream(input: ModelInput, signal?: AbortSignal): AsyncIterable<string>;
}

export interface LocalModelAdapter {
  availability(): Promise<ModelAvailability>;
  capabilities?: () => Promise<MediaCapability>;
  create(
    initialPrompts: ModelPrompt[],
    signal?: AbortSignal,
    onProgress?: (progress: ModelProgress) => void,
    mediaKinds?: MediaKind[],
  ): Promise<LocalModelSession>;
}
