import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Composer } from "@/features/assistant/components/Composer";

const base = {
  onChange: vi.fn(),
  onStop: vi.fn(),
  onSubmit: vi.fn(),
  value: "",
  work: { status: "idle" as const },
};

describe("media capability controls", () => {
  it("uses one picker with the modalities reported by the current model", () => {
    const { rerender } = render(
      <Composer
        {...base}
        capabilities={{
          text: true,
          image: false,
          audio: true,
          observedAt: 1,
          modelIdentity: "fake",
          error: null,
        }}
      />,
    );

    const mediaButton = screen.getByRole("button", { name: "Add media" });
    expect(mediaButton).toBeVisible();
    expect(screen.getByLabelText("Choose media attachments")).toHaveAttribute("accept", "audio/*");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    rerender(
      <Composer
        {...base}
        capabilities={{
          text: true,
          image: true,
          audio: true,
          observedAt: 2,
          modelIdentity: "fake",
          error: null,
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Add media" })).toBeVisible();
    expect(screen.getByLabelText("Choose media attachments")).toHaveAttribute(
      "accept",
      "image/*,audio/*",
    );
  });
});
