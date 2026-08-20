import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AssistantWorkspace } from "@/features/assistant/AssistantWorkspace";
import { MemoryAssistantRepository } from "@/features/assistant/storage/memoryRepository";
import { toSubmissionId } from "@/features/assistant/types";
import { createFakeModelAdapter } from "../../fixtures/fakeLanguageModel";

describe("session management", () => {
  it("exposes the portfolio return as an icon-only top navigation link", async () => {
    const repository = new MemoryAssistantRepository();
    const { adapter } = createFakeModelAdapter();
    render(<AssistantWorkspace adapter={adapter} repository={repository} />);

    const portfolioLink = await screen.findByRole("link", {
      name: "Return to portfolio",
    });
    expect(portfolioLink).toBeVisible();
    expect(portfolioLink).toHaveAttribute("href", "/");
    expect(portfolioLink).toHaveAttribute("title", "Return to portfolio");
    expect(screen.queryByText("Return to portfolio")).not.toBeInTheDocument();
  });

  it("disambiguates duplicate chat titles without changing their stored title", async () => {
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("duplicate-one"),
      text: "Same title",
    });
    await repository.acceptPrompt({
      at: 2,
      sessionId: null,
      submissionId: toSubmissionId("duplicate-two"),
      text: "Same title",
    });
    const { adapter } = createFakeModelAdapter();
    render(<AssistantWorkspace adapter={adapter} repository={repository} />);

    expect(
      await screen.findByRole("button", { name: "Same title, chat 1 of 2" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Same title, chat 2 of 2" })).toBeVisible();
  });

  it("confirms one-session deletion and Clear all without false persistence copy", async () => {
    const user = userEvent.setup();
    const repository = new MemoryAssistantRepository();
    await repository.initialize();
    await repository.acceptPrompt({
      at: 1,
      sessionId: null,
      submissionId: toSubmissionId("one"),
      text: "First retained session",
    });
    await repository.acceptPrompt({
      at: 2,
      sessionId: null,
      submissionId: toSubmissionId("two"),
      text: "Second removable session",
    });
    const { adapter } = createFakeModelAdapter();
    render(<AssistantWorkspace adapter={adapter} repository={repository} />);

    const deleteSecond = await screen.findByRole("button", {
      name: "Delete Second removable session",
    });
    await user.click(deleteSecond);
    expect(screen.getByRole("dialog", { name: /delete second removable session/i })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(deleteSecond).toHaveFocus();
    await user.click(deleteSecond);
    await user.click(screen.getByRole("button", { name: "Delete chat" }));
    expect(screen.queryByRole("button", { name: "Second removable session" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "First retained session" })).toBeVisible();
    await waitFor(() => expect(screen.getByRole("button", { name: "Chats" })).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Clear all chats" }));
    expect(screen.getByRole("dialog", { name: /clear all local assistant data/i })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear everything" }));
    expect(screen.queryByRole("button", { name: "First retained session" })).not.toBeInTheDocument();
    expect(screen.getByText("Not saved")).toBeVisible();
  });
});
