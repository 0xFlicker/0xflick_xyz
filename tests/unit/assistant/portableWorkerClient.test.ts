import { describe, expect, it, vi } from "vitest";

import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";
import { PortableLanguageModelAdapter } from "@/features/assistant/model/portableLanguageModel";
import { FakePortableWorker } from "../../fixtures/fakePortableWorker";

describe("PortableLanguageModelAdapter", () => {
  it("requires non-whitespace readiness and reports measured or indeterminate progress", async () => {
    const worker = new FakePortableWorker({
      progress: [
        { loaded: null, total: null },
        { loaded: 50, total: 100 },
      ],
      readinessText: "ready",
    });
    const adapter = new PortableLanguageModelAdapter(MODEL_CATALOG[2], () => worker);
    const progress = vi.fn();

    const session = await adapter.create([], undefined, progress);

    expect(progress).toHaveBeenCalledWith({ state: "preparing" });
    expect(progress).toHaveBeenCalledWith({ state: "downloading", fraction: 0.5 });
    expect(await adapter.availability()).toEqual({ state: "available" });
    session.destroy();
  });

  it("rejects whitespace readiness output", async () => {
    const worker = new FakePortableWorker({ readinessText: "   " });
    const adapter = new PortableLanguageModelAdapter(MODEL_CATALOG[2], () => worker);

    await expect(adapter.create([])).rejects.toMatchObject({ code: "empty_response" });
    expect(await adapter.availability()).not.toEqual({ state: "available" });
  });

  it("measures with the target runtime, streams cumulative text, and disposes once", async () => {
    const worker = new FakePortableWorker({ deltas: ["Local", " answer"] });
    const adapter = new PortableLanguageModelAdapter(MODEL_CATALOG[2], () => worker);
    const session = await adapter.create([{ role: "system", content: "Be brief." }]);

    await expect(session.measure([{ role: "user", content: "Hello" }])).resolves.toEqual({
      usage: 12,
      window: 8_192,
    });
    const output: string[] = [];
    for await (const text of session.stream([{ role: "user", content: "Hello" }])) {
      output.push(text);
    }
    expect(output).toEqual(["Local", "Local answer"]);
    session.destroy();
    session.destroy();
    expect(worker.commands.filter((command) => command.kind === "dispose")).toHaveLength(1);
  });

  it("uses cooperative interruption without an elapsed-time deadline", async () => {
    const worker = new FakePortableWorker({ deltas: ["One"], holdOpen: true });
    const adapter = new PortableLanguageModelAdapter(MODEL_CATALOG[2], () => worker);
    const session = await adapter.create([]);
    const abort = new AbortController();
    const iterator = session.stream("Count", abort.signal)[Symbol.asyncIterator]();
    await expect(iterator.next()).resolves.toEqual({ done: false, value: "One" });
    abort.abort();
    await expect(iterator.next()).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.commands.some((command) => command.kind === "interrupt")).toBe(true);
  });
});
