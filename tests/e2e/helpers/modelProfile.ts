import type { BrowserContext } from "@playwright/test";

export async function installThreeModelProfile(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", { configurable: true, value: {} });
    Object.assign(window, {
      __portableWorkerCreations: 0,
      __portablePreparationDelay: {},
      __portableReadinessFailure: false,
    });
    window.__FLICK_ASSISTANT_MODEL_REGISTRY__ = {
      clearPipelineCache: async () => {
        localStorage.setItem("fake-portable-cache", "missing");
      },
      getFileMetadata: async (_repository, file) => ({
        exists: true,
        size: file.endsWith(".onnx") ? 181_000_000 : 1_000,
      }),
      getPipelineFiles: async () => [
        "config.json",
        "tokenizer.json",
        "onnx/model_q4.onnx",
      ],
      isPipelineCachedFiles: async () => {
        const cached = localStorage.getItem("fake-portable-cache") !== "missing";
        return {
          allCached: cached,
          files: [
            { file: "config.json", cached },
            { file: "tokenizer.json", cached },
            { file: "onnx/model_q4.onnx", cached },
          ],
        };
      },
    };

    class FakeLanguageModel {
      static availability() { return Promise.resolve("available"); }
      static create() { return Promise.resolve(new FakeLanguageModel()); }
      contextUsage = 10;
      contextWindow = 8_192;
      addEventListener() {}
      removeEventListener() {}
      destroy() {}
      measureContextUsage() { return Promise.resolve(24); }
      promptStreaming() {
        return new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Native local response.");
            controller.close();
          },
        });
      }
    }
    Object.defineProperty(globalThis, "LanguageModel", {
      configurable: true,
      value: FakeLanguageModel,
    });

    window.__FLICK_ASSISTANT_PORTABLE_WORKER_FACTORY__ = () => {
      window.__portableWorkerCreations += 1;
      let handler: ((event: MessageEvent) => void) | null = null;
      let interrupted = false;
      const emit = (data: object) => handler?.({ data } as MessageEvent);
      return {
        get onmessage() { return handler; },
        set onmessage(value) { handler = value; },
        postMessage(command) {
          const base = {
            attemptId: command.attemptId,
            runtimeIdentity: command.runtimeIdentity,
          };
          if (command.kind === "prepare") {
            localStorage.setItem("fake-portable-cache", "ready");
            const finish = () => {
              emit({
                ...base,
                kind: "progress",
                loaded: 50,
                total: 100,
                progress: 0.5,
                stage: "loading",
              });
              emit({ ...base, kind: "ready", contextLimit: 8_192 });
            };
            const delay = window.__portablePreparationDelay[command.runtimeIdentity] ?? 0;
            if (delay > 0) window.setTimeout(finish, delay);
            else queueMicrotask(finish);
          } else if (command.kind === "healthCheck") {
            queueMicrotask(() => emit({
              ...base,
              kind: "complete",
              text: window.__portableReadinessFailure ? "   " : "ready",
            }));
          } else if (command.kind === "measure") {
            queueMicrotask(() => emit({ ...base, kind: "measurement", used: 32, capacity: 8_192 }));
          } else if (command.kind === "generate") {
            interrupted = false;
            queueMicrotask(() => {
              if (interrupted) return;
              emit({ ...base, kind: "delta", text: "Portable local response." });
              emit({ ...base, kind: "complete", text: "Portable local response." });
            });
          } else if (command.kind === "interrupt") {
            interrupted = true;
            queueMicrotask(() => emit({ ...base, kind: "interrupted", text: "" }));
          } else if (command.kind === "dispose") {
            queueMicrotask(() => emit({ ...base, kind: "disposed" }));
          }
        },
        terminate() { interrupted = true; },
      };
    };
  });
}

declare global {
  interface Window {
    __portablePreparationDelay: Record<string, number>;
    __portableReadinessFailure: boolean;
    __portableWorkerCreations: number;
  }
}
