import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContextDetails } from "@/features/assistant/components/ContextDetails";
import type { ContextState } from "@/features/assistant/types";
import { toSessionId, toTurnId } from "@/features/assistant/types";

function context(state: ContextState["state"], usage: number | null): ContextState {
  return {
    sessionId: toSessionId("session"),
    epoch: 0,
    state,
    summaryText: state === "compacted" ? "Older facts retained." : null,
    summarizedThroughTurnId: state === "compacted" ? toTurnId("turn-2") : null,
    directFromTurnId: state === "compacted" ? toTurnId("turn-3") : null,
    contextUsage: usage,
    contextWindow: usage === null ? null : 100,
    promptVersion: 1,
    sourceHistoryRevision: 4,
    personalityRevision: 0,
    compactedAt: state === "compacted" ? 100 : null,
    overflowedAt: state === "overflowed" ? 101 : null,
    modelKey: "browser-prompt-api",
    modelRevision: 0,
    generatedByModelKey: state === "compacted" ? "browser-prompt-api" : null,
    appliesThroughTurnId: state === "compacted" ? toTurnId("turn-2") : null,
  };
}

describe("ContextDetails", () => {
  it("labels a measured percentage as context used", () => {
    render(
      <ContextDetails
        canCompact={false}
        context={context("fresh", 2)}
        onCompact={vi.fn()}
      />,
    );

    expect(screen.getByText("Context used")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Conversation context usage" })).toHaveValue(
      2,
    );
  });

  it("explains high usage without exposing implementation details", async () => {
    const user = userEvent.setup();
    render(
      <ContextDetails
        canCompact
        context={context("warning", 75)}
        onCompact={vi.fn()}
      />,
    );
    expect(screen.getByText("Nearing context limit")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Conversation context usage" })).toHaveValue(
      75,
    );
    await user.click(screen.getByRole("button", { name: "Context details" }));
    expect(screen.getByText("75% used")).toBeVisible();
    expect(screen.getByText(/older messages will be condensed automatically/i)).toBeVisible();
    expect(screen.getByText(/visible chat history stays unchanged/i)).toBeVisible();
    expect(screen.queryByText("Fixed assistant guidance")).not.toBeInTheDocument();
    expect(screen.queryByText("Personality preference")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compact now" })).toBeVisible();
  });

  it("keeps the generated compacted summary behind a disclosure", async () => {
    const user = userEvent.setup();
    render(
      <ContextDetails
        canCompact
        context={context("compacted", 48)}
        onCompact={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Context details" }));
    expect(screen.getByText("48% used")).toBeVisible();
    expect(screen.getByText(/older messages were condensed to make room/i)).toBeVisible();
    expect(screen.queryByText("Older facts retained.")).not.toBeVisible();

    await user.click(screen.getByText("See condensed summary"));
    expect(screen.getByText("Older facts retained.")).toBeVisible();
  });

  it("labels unknown and overflowed capacity without inventing a percentage", () => {
    const { rerender } = render(
      <ContextDetails canCompact={false} context={context("unknown", null)} onCompact={vi.fn()} />,
    );
    expect(screen.getByText("Context unknown")).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    rerender(
      <ContextDetails canCompact context={context("overflowed", 100)} onCompact={vi.fn()} />,
    );
    expect(screen.getByText("Context overflowed")).toBeVisible();
  });
});
