import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MessageContent } from "@/features/assistant/components/MessageContent";
import { Transcript } from "@/features/assistant/components/Transcript";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { toAttemptId, toSubmissionId } from "@/features/assistant/types";

describe("assistant Markdown safety", () => {
  it("renders hostile HTML, images, and unsafe schemes as inert content", () => {
    render(
      <MessageContent text={'<script>throw new Error("bad")</script>\n\n![tracker](https://tracker.invalid/pixel)\n\n[unsafe](data:text/html,bad)'} />,
    );
    expect(document.querySelector("script")).not.toBeInTheDocument();
    expect(document.querySelector("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "unsafe" })).not.toBeInTheDocument();
  });

  it("protects external links and contains long code and tables locally", () => {
    render(
      <MessageContent
        text={`[Reference](https://example.com/path)\n\n\`\`\`text\n${"x".repeat(400)}\n\`\`\`\n\n| ${"wide".repeat(80)} | B |\n|---|---|\n| A | B |`}
      />,
    );
    const link = screen.getByRole("link", { name: "Reference" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByLabelText("Scrollable code block")).toHaveClass("overflow-x-auto");
    expect(screen.getByLabelText("Scrollable table")).toHaveClass("overflow-x-auto");
  });

  it("copies source Markdown rather than rendered text", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    const accepted = await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("copy"),
      text: "Copy it",
    });
    const attemptId = toAttemptId("copy-attempt");
    await repository.claimNextTurn({
      at: 2,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
    });
    const source = "**Bold source**\n\n- one";
    await repository.finishTurn({
      at: 3,
      attemptId,
      epoch: accepted.epoch,
      sessionId: accepted.sessionId,
      status: "completed",
      text: source,
      turnId: accepted.turnId,
    });
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <Transcript
        conversation={await repository.getConversation(accepted.sessionId)}
        onRetry={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Copy response" }));
    expect(await screen.findByText("Copied")).toBeVisible();
    expect(writeText).toHaveBeenCalledWith(source);
  });
});
