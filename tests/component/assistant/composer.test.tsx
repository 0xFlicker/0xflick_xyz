import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("stages a pasted image as media", async () => {
    const onMediaChange = vi.fn();
    const file = new File([new Uint8Array([1, 2, 3])], "pasted.png", { type: "image/png" });
    render(
      <Composer
        {...requiredProps}
        capabilities={{
          text: true,
          image: true,
          audio: false,
          observedAt: 1,
          modelIdentity: "fake",
          error: null,
        }}
        onMediaChange={onMediaChange}
        onStop={vi.fn()}
        work={{ status: "idle" }}
      />,
    );

    fireEvent.paste(screen.getByLabelText("Message the local assistant"), {
      clipboardData: {
        files: [],
        items: [
          {
            getAsFile: () => file,
            kind: "file",
            type: "image/png",
          },
        ],
      },
    });

    await waitFor(() =>
      expect(onMediaChange).toHaveBeenCalledWith([
        expect.objectContaining({
          kind: "image",
          name: "pasted.png",
          source: file,
        }),
      ]),
    );
  });
});
