import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";

import { AssistantWorkspace } from "@/features/assistant/AssistantWorkspace";
import { AvailabilityPanel } from "@/features/assistant/components/AvailabilityPanel";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";
import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";
import type { LocalModelOption, ModelCatalogState } from "@/features/assistant/types";

function option(state: LocalModelOption["asset"]["state"], progress: number | null = null): LocalModelOption {
  return {
    descriptor: MODEL_CATALOG[2],
    active: false,
    pending: false,
    asset: {
      modelKey: "smollm2-135m-wasm",
      compatibility: "offered",
      state,
      requiredFiles: [],
      expectedBytes: 100,
      loadedBytes: null,
      progress,
      loadedRuntimeIdentity: null,
      failure: state === "failed" ? "download_failed" : null,
      observedAt: 1,
    },
  };
}

function catalog(model: LocalModelOption | null, status: ModelCatalogState["status"] = "ready"): ModelCatalogState {
  return {
    status,
    options: model ? [model] : [],
    selectedModelKey: model?.descriptor.key ?? null,
    activeModelKey: null,
    pendingModelKey: null,
  } as ModelCatalogState;
}

describe("assistant availability", () => {
  it("keeps IndexedDB durable through the Strict Mode setup-cleanup probe", async () => {
    const { adapter } = createFakeModelAdapter();

    render(
      <StrictMode>
        <AssistantWorkspace adapter={adapter} />
      </StrictMode>,
    );

    expect(await screen.findByText("Saved in this browser")).toBeVisible();
    expect(screen.queryByText("Not saved")).not.toBeInTheDocument();
  });

  it("renders checking, indeterminate and measured download, preparation, and setup failure states truthfully", () => {
    const actions = {
      onPrepare: () => undefined,
      onRetry: () => undefined,
      onStopWaiting: () => undefined,
    };
    const { rerender } = render(
      <AvailabilityPanel catalog={catalog(null, "checking")} option={null} {...actions} />,
    );
    expect(screen.getByRole("heading", { name: /checking local models/i })).toBeVisible();

    rerender(
      <AvailabilityPanel
        catalog={catalog(option("preparing"))}
        option={option("preparing")}
        {...actions}
      />,
    );
    expect(screen.getByRole("progressbar", { name: /model preparation progress/i })).not.toHaveAttribute(
      "value",
    );
    expect(screen.queryByText(/0%/i)).not.toBeInTheDocument();

    rerender(
      <AvailabilityPanel
        catalog={catalog(option("preparing", 0.42))}
        option={option("preparing", 0.42)}
        {...actions}
      />,
    );
    expect(screen.getByRole("progressbar", { name: /model preparation progress/i })).toHaveValue(
      0.42,
    );

    rerender(<AvailabilityPanel catalog={catalog(option("checking"))} option={option("checking")} {...actions} />);
    expect(screen.getByRole("heading", { name: /preparing SmolLM2/i })).toBeVisible();

    rerender(
      <AvailabilityPanel
        catalog={catalog(option("failed"))}
        option={option("failed")}
        {...actions}
      />,
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  it("keeps the takeover and disclosure when on-device AI is unavailable", async () => {
    const { adapter, lifecycle } = createFakeModelAdapter({
      availability: { state: "unavailable" },
    });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    expect(await screen.findByRole("heading", { name: /No local model can be offered here/i })).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry detection" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    expect(screen.getByText(/no tools or live web access/i)).toBeVisible();
    expect(lifecycle.created).toBe(0);
  });

  it("requires an explicit action before preparation and reaches ready after model initialization", async () => {
    const user = userEvent.setup();
    const { adapter, lifecycle } = createFakeModelAdapter({
      availability: { state: "downloadable" },
      progress: [0.25, 1],
    });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    const prepare = await screen.findByRole("button", { name: "Prepare this model" });
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    expect(lifecycle.created).toBe(0);
    await user.click(prepare);
    await user.click(screen.getByRole("button", { name: "Download and prepare" }));

    const composer = await screen.findByLabelText("Message the local assistant");
    expect(composer).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    expect(lifecycle.created).toBe(1);

    await user.type(composer, "Use the prepared session");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("A local response.")).toBeVisible();
    expect(lifecycle.created).toBe(1);
  });

  it("does not present synthetic create progress as a download for an available model", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter({
      availability: { state: "available" },
      createDelayMs: 80,
      progress: [0, 1],
    });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    await user.type(
      await screen.findByLabelText("Message the local assistant"),
      "Already downloaded",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.queryByText(/downloading the on-device model/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/download complete/i)).not.toBeInTheDocument();
    expect(await screen.findByText("A local response.")).toBeVisible();
  });

  it("keeps context hidden in a blank ready chat and shows it after the first turn", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter();
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    const composer = await screen.findByLabelText("Message the local assistant");
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    await user.type(composer, "Create measurable context");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Context used")).toBeVisible();
  });

  it("stops waiting without claiming installed files were removed", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter({
      availability: { state: "downloadable" },
      createDelayMs: 10_000,
      progress: [0.3],
    });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Prepare this model" }),
    );
    await user.click(screen.getByRole("button", { name: "Download and prepare" }));
    const stopButtons = await screen.findAllByRole("button", { name: "Stop waiting" });
    await user.click(stopButtons.at(-1)!);

    expect(await screen.findByRole("button", { name: "Prepare this model" })).toBeVisible();
    expect(screen.queryByText(/files were removed/i)).not.toBeInTheDocument();
  });

  it("keeps the prompt and exposes retry when a ready model returns no text", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter({ chunks: [] });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    await user.type(
      await screen.findByLabelText("Message the local assistant"),
      "Keep this prompt",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect((await screen.findAllByText("Keep this prompt")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Retry response" })).toBeVisible();
  });
});
