import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BrowserLanguageModelAdapter,
  LANGUAGE_MODEL_OPTIONS,
} from "@/features/assistant/model/browserLanguageModel";
import { normalizeModelError } from "@/features/assistant/model/errorMapping";

class FakeMonitor extends EventTarget {
  ondownloadprogress: ((this: CreateMonitor, event: ProgressEvent) => unknown) | null =
    null;
}

function normalizedProgressEvent(loaded: number): ProgressEvent {
  const event = new ProgressEvent("downloadprogress", {
    lengthComputable: true,
    loaded: 0,
    total: 10,
  });
  Object.defineProperty(event, "loaded", { configurable: true, value: loaded });
  return event;
}

class NativeLanguageModel extends EventTarget {
  static availabilityValue: Availability = "available";
  static availabilityOptions: LanguageModelCreateCoreOptions | undefined;
  static availabilityOptionsHistory: LanguageModelCreateCoreOptions[] = [];
  static createOptions: LanguageModelCreateOptions | undefined;
  static instance: NativeLanguageModel | null = null;

  static async availability(options?: LanguageModelCreateCoreOptions) {
    this.availabilityOptions = options;
    if (options) this.availabilityOptionsHistory.push(options);
    return this.availabilityValue;
  }

  static async create(options?: LanguageModelCreateOptions) {
    this.createOptions = options;
    if (options?.monitor) {
      const monitor = new FakeMonitor();
      options.monitor(monitor);
      monitor.dispatchEvent(normalizedProgressEvent(0.5));
      monitor.dispatchEvent(normalizedProgressEvent(1));
    }
    this.instance = new NativeLanguageModel();
    return this.instance;
  }

  contextUsage = 14;
  contextWindow = 128;
  destroyed = 0;

  destroy() {
    this.destroyed += 1;
  }

  measureContextUsage() {
    return Promise.resolve(23);
  }

  promptStreaming() {
    return new ReadableStream<string>({
      start(controller) {
        controller.enqueue("Hel");
        controller.enqueue("Hello");
        controller.enqueue(" world");
        controller.close();
      },
    });
  }
}

describe("BrowserLanguageModelAdapter", () => {
  beforeEach(() => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    NativeLanguageModel.availabilityValue = "available";
    NativeLanguageModel.availabilityOptions = undefined;
    NativeLanguageModel.availabilityOptionsHistory = [];
    NativeLanguageModel.createOptions = undefined;
    NativeLanguageModel.instance = null;
    vi.stubGlobal("LanguageModel", NativeLanguageModel);
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["unavailable", { state: "unavailable" }],
    ["downloadable", { state: "downloadable" }],
    ["downloading", { state: "downloading" }],
    ["available", { state: "available" }],
  ] as const)("normalizes %s availability with exact English text options", async (value, expected) => {
    NativeLanguageModel.availabilityValue = value;
    const adapter = new BrowserLanguageModelAdapter();

    await expect(adapter.availability()).resolves.toEqual(expected);
    expect(NativeLanguageModel.availabilityOptions).toEqual(LANGUAGE_MODEL_OPTIONS);
    expect(LANGUAGE_MODEL_OPTIONS).toEqual({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });
  });

  it("reports unavailable outside a secure context or without the global API", async () => {
    const adapter = new BrowserLanguageModelAdapter();
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: false });
    await expect(adapter.availability()).resolves.toEqual({ state: "unavailable" });

    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
    vi.stubGlobal("LanguageModel", undefined);
    await expect(adapter.availability()).resolves.toEqual({ state: "unavailable" });
  });

  it("creates with exact options, distinguishes preparation, normalizes streams, and destroys once", async () => {
    const adapter = new BrowserLanguageModelAdapter();
    const progress = vi.fn();
    const session = await adapter.create(
      [{ role: "system", content: "Fixed" }],
      undefined,
      progress,
    );

    expect(NativeLanguageModel.createOptions?.expectedInputs).toEqual(
      LANGUAGE_MODEL_OPTIONS.expectedInputs,
    );
    expect(progress).toHaveBeenNthCalledWith(1, { state: "downloading", fraction: 0.5 });
    expect(progress).toHaveBeenNthCalledWith(2, { state: "preparing" });
    expect(await session.measure("hello")).toEqual({ usage: 23, window: 128 });

    const chunks: string[] = [];
    for await (const chunk of session.stream("hello")) chunks.push(chunk);
    expect(chunks).toEqual(["Hel", "Hello", "Hello world"]);

    session.destroy();
    session.destroy();
    expect(NativeLanguageModel.instance?.destroyed).toBe(1);
  });

  it("probes image and audio independently and creates multimodal sessions", async () => {
    const adapter = new BrowserLanguageModelAdapter();
    const capabilities = await adapter.capabilities();
    expect(capabilities).toMatchObject({ text: true, image: true, audio: true });
    expect(
      NativeLanguageModel.availabilityOptionsHistory.map((options) =>
        options.expectedInputs?.map((input) => input.type),
      ),
    ).toEqual([["text"], ["text", "image"], ["text", "audio"]]);

    await adapter.create([], undefined, undefined, ["image", "audio"]);
    expect(NativeLanguageModel.createOptions?.expectedInputs?.map((input) => input.type)).toEqual([
      "text",
      "image",
      "audio",
    ]);
  });

  it.each([
    ["NotAllowedError", "activation_required"],
    ["NotSupportedError", "unsupported_input"],
    ["NetworkError", "download_failed"],
    ["NotReadableError", "output_filtered"],
    ["QuotaExceededError", "context_too_large"],
    ["AbortError", "aborted"],
    ["OperationError", "operation_failed"],
    ["UnknownError", "api_changed"],
  ] as const)("normalizes %s without retaining native error text", (name, expected) => {
    expect(normalizeModelError(new DOMException("prompt-bearing detail", name))).toBe(
      expected,
    );
  });

  it("destroys a model that resolves after setup was aborted", async () => {
    let resolveCreate: (model: NativeLanguageModel) => void = () => undefined;
    class LateLanguageModel extends NativeLanguageModel {
      static create() {
        return new Promise<NativeLanguageModel>((resolve) => {
          resolveCreate = resolve;
        });
      }
    }
    vi.stubGlobal("LanguageModel", LateLanguageModel);
    const abort = new AbortController();
    const pending = new BrowserLanguageModelAdapter().create([], abort.signal);
    abort.abort();
    const late = new NativeLanguageModel();
    resolveCreate(late);

    await expect(pending).rejects.toMatchObject({ code: "aborted" });
    expect(late.destroyed).toBe(1);
  });

  it("fails closed when Chrome returns an unknown availability value", async () => {
    class ChangedLanguageModel {
      static availability() {
        return Promise.resolve("changed-value");
      }
    }
    vi.stubGlobal("LanguageModel", ChangedLanguageModel);

    await expect(new BrowserLanguageModelAdapter().availability()).rejects.toMatchObject({
      code: "api_changed",
    });
  });
});
