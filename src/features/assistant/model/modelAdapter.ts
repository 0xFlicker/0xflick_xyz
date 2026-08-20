import type {
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
  create(
    initialPrompts: ModelPrompt[],
    signal?: AbortSignal,
    onProgress?: (progress: ModelProgress) => void,
  ): Promise<LocalModelSession>;
}
