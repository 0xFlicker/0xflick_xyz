import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssistantWorkspace } from "@/features/assistant/AssistantWorkspace";
import { MessageContent } from "@/features/assistant/components/MessageContent";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

describe("Assistant conversation", () => {
  it("keeps VoiceOver anchored to the composer until the response is announced", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter({
      chunks: ["Accessible response."],
      createDelayMs: 80,
    });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    const composer = await screen.findByLabelText("Message the local assistant");
    await user.type(composer, "Keep focus stable{enter}");

    expect(await screen.findByText("Preparing your message")).toBeVisible();
    expect(screen.getByLabelText("Message the local assistant")).toBe(composer);
    expect(composer).toHaveFocus();
    expect(
      await screen.findByText("Response complete. Accessible response."),
    ).toHaveClass("sr-only");
  });

  it("announces completed Markdown as plain text", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter({
      chunks: [
        "## Helpful answer\n\nUse **bold**, _emphasis_, and [named links](https://example.com).",
      ],
    });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    await user.type(
      await screen.findByLabelText("Message the local assistant"),
      "Use formatting{enter}",
    );

    expect(
      await screen.findByText(
        "Response complete. Helpful answer Use bold, emphasis, and named links.",
      ),
    ).toHaveClass("sr-only");
  });

  it("sends multi-line turns, keeps visible lifecycle feedback, and starts a new chat", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAssistantRepository();
    const { adapter, lifecycle } = createFakeModelAdapter({
      chunks: ["A", "A local answer."],
    });
    render(<AssistantWorkspace adapter={adapter} repository={repository} />);

    const composer = await screen.findByLabelText("Message the local assistant");
    await user.type(composer, "First line{shift>}{enter}{/shift}Second line");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("A local answer.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/complete/i);
    expect(
      screen.getByText("Response complete. A local answer."),
    ).toHaveClass("sr-only");
    const userMessage = screen.getByText(
      (_, element) => element?.textContent === "First line\nSecond line",
    );
    expect(userMessage).toBeInTheDocument();
    expect(userMessage).toHaveClass("min-w-0", "break-words");

    await user.type(screen.getByLabelText("Message the local assistant"), "Follow up");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect((await screen.findAllByText("A local answer.")).length).toBe(2);
    expect(lifecycle).toEqual({ created: 1, destroyed: 0 });

    await user.click(screen.getAllByRole("button", { name: "New chat" })[0]);
    expect(screen.getByLabelText("Message the local assistant")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "First line Second line" }),
    ).toBeVisible();
    expect(lifecycle).toEqual({ created: 1, destroyed: 1 });
  });

  it("stops generation while preserving and copying partial output", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAssistantRepository();
    const { adapter } = createFakeModelAdapter({
      chunks: ["Partial", "Partial response that should not arrive"],
      delayMs: 30,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<AssistantWorkspace adapter={adapter} repository={repository} />);

    await user.type(
      await screen.findByLabelText("Message the local assistant"),
      "A slow request",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("Partial")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stop response" }));

    expect(await screen.findByText("Stopped")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Copy response" }));
    expect(writeText).toHaveBeenCalledWith("Partial");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("offers retry after a failed response", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAssistantRepository();
    const { adapter } = createFakeModelAdapter({ streamError: "operation_failed" });
    render(<AssistantWorkspace adapter={adapter} repository={repository} />);

    await user.type(
      await screen.findByLabelText("Message the local assistant"),
      "Please retry this",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("button", { name: "Retry response" })).toBeVisible();
  });

  it("explains when Chrome filters the model output", async () => {
    const user = userEvent.setup();
    const { adapter } = createFakeModelAdapter({ streamError: "output_filtered" });
    render(
      <AssistantWorkspace
        adapter={adapter}
        repository={new MemoryAssistantRepository()}
      />,
    );

    await user.type(
      await screen.findByLabelText("Message the local assistant"),
      "A prompt Chrome filters",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText(/local model did not return that response/i)).toBeVisible();
  });
});

describe("MessageContent", () => {
  it("renders safe Markdown without HTML, images, or unsafe links", async () => {
    render(
      <MessageContent
        text={
          "## Heading\n\n- item\n\n<img src='https://example.com/tracker'>\n\n[bad](javascript:alert(1))"
        }
      />,
    );

    expect(screen.getByRole("heading", { name: "Heading" })).toBeVisible();
    expect(screen.getByText("item")).toBeVisible();
    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
  });
});
