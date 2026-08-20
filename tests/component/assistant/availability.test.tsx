import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";

import { AssistantWorkspace } from "@/features/assistant/AssistantWorkspace";
import { AvailabilityPanel } from "@/features/assistant/components/AvailabilityPanel";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

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

  it("renders checking, measured download, finalization, and setup failure states truthfully", () => {
    const actions = {
      onPrepare: () => undefined,
      onRetry: () => undefined,
      onStopWaiting: () => undefined,
    };
    const { rerender } = render(
      <AvailabilityPanel environment={{ status: "checking" }} {...actions} />,
    );
    expect(screen.getByRole("heading", { name: /checking this browser/i })).toBeVisible();

    rerender(
      <AvailabilityPanel
        environment={{ status: "downloading", fraction: 0.42 }}
        {...actions}
      />,
    );
    expect(screen.getByRole("progressbar", { name: /model download progress/i })).toHaveValue(
      0.42,
    );
    expect(screen.getByText("42% reported")).toBeVisible();

    rerender(<AvailabilityPanel environment={{ status: "finalizing" }} {...actions} />);
    expect(screen.getByRole("heading", { name: /download complete/i })).toBeVisible();

    rerender(
      <AvailabilityPanel
        environment={{ status: "failed", code: "download_failed" }}
        {...actions}
      />,
    );
    expect(screen.getByRole("button", { name: "Retry detection" })).toBeVisible();
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

    expect(await screen.findByRole("heading", { name: /not available here/i })).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry detection" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    expect(screen.getByText(/no tools or live web access/i)).toBeVisible();
    expect(lifecycle.created).toBe(0);
  });

  it("requires an explicit action before preparation and reaches ready after finalizing", async () => {
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

    const prepare = await screen.findByRole("button", { name: "Prepare on this device" });
    expect(screen.getByText(/substantial model download/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    expect(lifecycle.created).toBe(0);
    await user.click(prepare);

    const composer = await screen.findByLabelText("Message the local assistant");
    expect(composer).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    expect(lifecycle.created).toBe(1);
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

  it("stops waiting without claiming Chrome's shared download was cancelled", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter({
      availability: { state: "downloadable" },
      createDelayMs: 80,
      progress: [0.3],
    });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Prepare on this device" }),
    );
    await user.click(await screen.findByRole("button", { name: "Stop waiting" }));

    expect(await screen.findByText(/stopped waiting on this page/i)).toBeVisible();
    expect(screen.getByText(/Chrome may continue/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry detection" })).toBeVisible();
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
