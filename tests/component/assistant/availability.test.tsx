import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("renders checking, indeterminate and measured download, preparation, and setup failure states truthfully", () => {
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
        environment={{ status: "downloading", fraction: null }}
        {...actions}
      />,
    );
    expect(screen.getByRole("progressbar", { name: /model download progress/i })).not.toHaveAttribute(
      "value",
    );
    expect(screen.queryByText(/0%/i)).not.toBeInTheDocument();

    rerender(
      <AvailabilityPanel
        environment={{ status: "downloading", fraction: 0.42 }}
        {...actions}
      />,
    );
    expect(screen.getByRole("progressbar", { name: /model download progress/i })).toHaveValue(
      0.42,
    );
    expect(screen.getByText("42% downloaded")).toBeVisible();

    rerender(<AvailabilityPanel environment={{ status: "preparing" }} {...actions} />);
    expect(screen.getByRole("heading", { name: /getting the model ready/i })).toBeVisible();

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

    const prepare = await screen.findByRole("button", { name: "Prepare on this device" });
    expect(screen.getByText(/substantial model download/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Context details" })).not.toBeInTheDocument();
    expect(lifecycle.created).toBe(0);
    await user.click(prepare);

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

    expect(await screen.findByRole("status")).toHaveTextContent("Preparing your message");
    expect(screen.queryByText(/downloading the on-device model/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/download complete/i)).not.toBeInTheDocument();
    expect(await screen.findByText("A local response.")).toBeVisible();
  });

  it("notices a background download becoming available without manual Retry", async () => {
    const fake = createFakeModelAdapter();
    let availabilityChecks = 0;
    const adapter = {
      ...fake.adapter,
      availability: async () => {
        availabilityChecks += 1;
        return availabilityChecks === 1
          ? ({ state: "downloading" } as const)
          : ({ state: "available" } as const);
      },
    };
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    expect(await screen.findByText(/Chrome is downloading the on-device model/i)).toBeVisible();
    fireEvent(document, new Event("visibilitychange"));

    expect(await screen.findByLabelText("Message the local assistant")).toBeEnabled();
    expect(availabilityChecks).toBeGreaterThanOrEqual(2);
  });

  it("keeps watching when page setup ends before Chrome's background download", async () => {
    const user = userEvent.setup();
    const fake = createFakeModelAdapter({ createError: "operation_failed" });
    let availabilityChecks = 0;
    const adapter = {
      ...fake.adapter,
      availability: async () => {
        availabilityChecks += 1;
        if (availabilityChecks === 1) return { state: "downloadable" } as const;
        if (availabilityChecks === 2) return { state: "downloading" } as const;
        return { state: "available" } as const;
      },
    };
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Prepare on this device" }),
    );
    expect(await screen.findByText(/Chrome is downloading the on-device model/i)).toBeVisible();

    await act(
      async () =>
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 0);
        }),
    );
    expect(document.visibilityState).toBe("visible");
    fireEvent(document, new Event("visibilitychange"));
    expect(availabilityChecks).toBeGreaterThanOrEqual(3);

    expect(await screen.findByLabelText("Message the local assistant")).toBeEnabled();
    expect(availabilityChecks).toBeGreaterThanOrEqual(3);
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
