import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Composer } from "@/features/assistant/components/Composer";
import { toTurnId } from "@/features/assistant/types";

const requiredProps = {
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  value: "",
};

describe("Composer activity states", () => {
  it("keeps the composer mounted while context is assessed", () => {
    render(
      <Composer
        {...requiredProps}
        onStop={vi.fn()}
        work={{ status: "checking_context", turnId: toTurnId("turn") }}
      />,
    );

    expect(screen.getByLabelText("Message the local assistant")).toBeVisible();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(screen.queryByText("Preparing your message…")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("replaces the composer with the approved automatic-compaction state", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(
      <Composer
        {...requiredProps}
        onStop={onStop}
        work={{ status: "compacting", turnId: toTurnId("turn") }}
      />,
    );

    expect(screen.getByText("Making room for this conversation…")).toBeVisible();
    expect(screen.getByText("Your message will start automatically.")).toBeVisible();
    expect(screen.queryByLabelText("Message the local assistant")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop response" })).not.toBeInTheDocument();

    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel).toHaveFocus();
    await user.click(cancel);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("does not offer an ineffective cancel action during manual compaction", () => {
    render(
      <Composer
        {...requiredProps}
        onStop={vi.fn()}
        work={{ status: "compacting", turnId: null }}
      />,
    );

    expect(screen.getByText("Making room for this conversation…")).toBeVisible();
    expect(screen.getByText("You can continue when it’s ready.")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps Stop response for active response generation", () => {
    render(
      <Composer
        {...requiredProps}
        onStop={vi.fn()}
        work={{ status: "generating", turnId: toTurnId("turn"), hasContent: true }}
      />,
    );

    expect(screen.getByLabelText("Message the local assistant")).toBeVisible();
    expect(screen.getByRole("button", { name: "Stop response" })).toBeVisible();
  });
});
