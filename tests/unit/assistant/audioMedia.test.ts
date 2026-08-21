import { describe, expect, it } from "vitest";

import { currentTurnPrompt } from "@/features/assistant/context/prompt";
import { createMediaHistoryDraft } from "@/features/assistant/storage/mediaHistory";
import { audioFixture } from "../../fixtures/mediaFixtures";

describe("audio media input", () => {
  it("preserves audio as an ordered current-turn content part", () => {
    const audio = audioFixture();
    expect(currentTurnPrompt("Transcribe this", [audio])[0]?.content).toEqual([
      { type: "text", value: "Transcribe this" },
      { type: "audio", value: audio.source },
    ]);
  });

  it("retains an audio identity and metadata without a durable source", async () => {
    const audio = audioFixture("meeting.wav");
    const draft = await createMediaHistoryDraft(audio);
    expect(draft).toMatchObject({
      kind: "audio",
      label: "meeting.wav",
      durationSeconds: 1,
      thumbnail: null,
    });
  });
});
