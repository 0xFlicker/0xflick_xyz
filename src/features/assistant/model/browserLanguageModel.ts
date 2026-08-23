import type {
  LocalModelAdapter,
  LocalModelSession,
} from "@/features/assistant/model/modelAdapter";
import { normalizedModelError } from "@/features/assistant/model/errorMapping";
import { MODEL_CATALOG, runtimeIdentityFor } from "@/features/assistant/model/modelCatalog";
import type {
  MediaCapability,
  MediaKind,
  ModelContentPart,
  ModelAvailability,
  ModelContext,
  ModelInput,
  ModelProgress,
  ModelPrompt,
} from "@/features/assistant/types";

export const LANGUAGE_MODEL_OPTIONS: LanguageModelCreateCoreOptions = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};

function optionsFor(mediaKinds: MediaKind[] = []): LanguageModelCreateCoreOptions {
  const types = ["text", ...mediaKinds.filter((kind, index) => mediaKinds.indexOf(kind) === index)];
  return {
    ...LANGUAGE_MODEL_OPTIONS,
    expectedInputs: types.map((type) => ({
      type: type as "text" | "image" | "audio",
      languages: ["en"],
    })),
  };
}

type NativeContentPart = {
  type: "text" | "image" | "audio";
  value: LanguageModelMessageValue | Blob;
};

function nativeContent(content: string | ModelContentPart[]): string | NativeContentPart[] {
  if (typeof content === "string") return content;
  return content.map((part) => ({ type: part.type, value: part.value }));
}

function nativePrompts(
  prompts: ModelPrompt[],
): LanguageModelCreateOptions["initialPrompts"] {
  const [first, ...rest] = prompts;
  if (!first) return [];
  if (first.role !== "system") {
    return prompts.map((prompt) => ({
      role: prompt.role === "system" ? "user" : prompt.role,
      content: nativeContent(prompt.content),
    }));
  }
  return [
    { role: "system", content: nativeContent(first.content) },
    ...rest.map((prompt) => ({
      role: prompt.role === "system" ? "user" : prompt.role,
      content: nativeContent(prompt.content),
    })),
  ];
}

function nativeInput(input: ModelInput): LanguageModelPrompt {
  if (typeof input === "string") return input;
  const messages: (LanguageModelMessage | LanguageModelAssistantMessage)[] = input.map(
    (prompt) =>
      prompt.role === "assistant"
        ? { role: "assistant", content: nativeContent(prompt.content) }
        : { role: "user", content: nativeContent(prompt.content) },
  );
  return messages;
}

class BrowserLanguageModelSession implements LocalModelSession {
  readonly modelKey = "browser-prompt-api" as const;
  readonly runtimeIdentity = runtimeIdentityFor(MODEL_CATALOG[0]);
  readonly capabilities;
  private destroyed = false;

  constructor(
    private readonly session: LanguageModel,
    mediaKinds: MediaKind[],
  ) {
    this.capabilities = {
      text: true,
      image: mediaKinds.includes("image"),
      audio: mediaKinds.includes("audio"),
    };
  }

  context(): ModelContext {
    if (this.destroyed) return { usage: null, window: null };
    return {
      usage: Number.isFinite(this.session.contextUsage)
        ? this.session.contextUsage
        : null,
      window: Number.isFinite(this.session.contextWindow)
        ? this.session.contextWindow
        : null,
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.session.destroy();
  }

  async measure(input: ModelInput, signal?: AbortSignal): Promise<ModelContext> {
    if (this.destroyed) throw new DOMException("Session destroyed", "InvalidStateError");
    try {
      const usage = await this.session.measureContextUsage(nativeInput(input), { signal });
      return {
        usage: Number.isFinite(usage) ? usage : null,
        window: Number.isFinite(this.session.contextWindow)
          ? this.session.contextWindow
          : null,
      };
    } catch (error) {
      throw normalizedModelError(error);
    }
  }

  onOverflow(listener: () => void): () => void {
    if (this.destroyed) return () => undefined;
    this.session.addEventListener("contextoverflow", listener);
    return () => this.session.removeEventListener("contextoverflow", listener);
  }

  async *stream(input: ModelInput, signal?: AbortSignal): AsyncIterable<string> {
    if (this.destroyed) throw new DOMException("Session destroyed", "InvalidStateError");
    const reader = this.session.promptStreaming(nativeInput(input), { signal }).getReader();
    let latest = "";
    try {
      while (!this.destroyed) {
        const result = await reader.read();
        if (result.done) break;
        latest = result.value.startsWith(latest) ? result.value : latest + result.value;
        yield latest;
      }
    } catch (error) {
      throw normalizedModelError(error);
    } finally {
      reader.releaseLock();
    }
  }
}

function normalizeAvailability(value: string): ModelAvailability {
  switch (value) {
    case "available":
      return { state: "available" };
    case "downloadable":
      return { state: "downloadable" };
    case "downloading":
      return { state: "downloading" };
    case "unavailable":
      return { state: "unavailable" };
    default:
      throw normalizedModelError(new DOMException("Unknown availability", "UnknownError"));
  }
}

export class BrowserLanguageModelAdapter implements LocalModelAdapter {
  readonly descriptor = MODEL_CATALOG[0];
  readonly runtimeIdentity = runtimeIdentityFor(this.descriptor);
  async availability(): Promise<ModelAvailability> {
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      typeof LanguageModel === "undefined"
    ) {
      return { state: "unavailable" };
    }
    try {
      return normalizeAvailability(await LanguageModel.availability(LANGUAGE_MODEL_OPTIONS));
    } catch (error) {
      throw normalizedModelError(error);
    }
  }

  async capabilities(): Promise<MediaCapability> {
    const observedAt = Date.now();
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      typeof LanguageModel === "undefined"
    ) {
      return {
        text: false,
        image: false,
        audio: false,
        observedAt,
        modelIdentity: this.runtimeIdentity,
        error: "media_unavailable",
      };
    }

    const probe = async (mediaKinds: MediaKind[]): Promise<boolean> => {
      try {
        return (
          normalizeAvailability(await LanguageModel.availability(optionsFor(mediaKinds))).state ===
          "available"
        );
      } catch {
        return false;
      }
    };
    const [text, image, audio] = await Promise.all([
      probe([]),
      probe(["image"]),
      probe(["audio"]),
    ]);
    return {
      text,
      image,
      audio,
      observedAt,
      modelIdentity: this.runtimeIdentity,
      error: text ? null : "media_unavailable",
    };
  }

  async create(
    initialPrompts: ModelPrompt[],
    signal?: AbortSignal,
    onProgress?: (progress: ModelProgress) => void,
    mediaKinds: MediaKind[] = [],
  ): Promise<LocalModelSession> {
    if (typeof LanguageModel === "undefined") {
      throw new DOMException("Prompt API unavailable", "NotSupportedError");
    }

    let created: LanguageModel;
    try {
      created = await LanguageModel.create({
        ...optionsFor(mediaKinds),
        initialPrompts: nativePrompts(initialPrompts),
        signal,
        monitor(monitor) {
          monitor.addEventListener("downloadprogress", (event) => {
            const fraction = Math.min(1, Math.max(0, event.loaded));
            onProgress?.(
              fraction >= 1
                ? { state: "preparing" }
                : { state: "downloading", fraction },
            );
          });
        },
      });
    } catch (error) {
      throw normalizedModelError(error);
    }

    if (signal?.aborted) {
      created.destroy();
      throw normalizedModelError(new DOMException("The operation was aborted", "AbortError"));
    }
    return new BrowserLanguageModelSession(created, mediaKinds);
  }
}
