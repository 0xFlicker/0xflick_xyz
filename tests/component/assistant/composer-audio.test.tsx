import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaAttachment } from "@/features/assistant/components/MediaAttachment";
import { audioFixture } from "../../fixtures/mediaFixtures";

describe("audio attachment presentation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps an accessible identity when playback cannot be restored", () => {
    render(<MediaAttachment part={audioFixture("note.wav")} temporary />);

    expect(screen.getByText("note.wav")).toBeVisible();
    expect(screen.getByText("Audio: note.wav · Not saved")).toBeVisible();
  });

  it("offers local playback controls when the page can create an object URL", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:assistant-audio");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    const { container } = render(<MediaAttachment part={audioFixture("note.wav")} />);

    expect(await screen.findByLabelText("Audio: note.wav")).toBeVisible();
    expect(container.querySelector("audio")).toHaveAttribute("controls");
  });
});
