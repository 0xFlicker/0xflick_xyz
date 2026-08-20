import { describe, expect, it } from "vitest";

import {
  assistantBrowserTitle,
  assistantDescription,
  assistantShareTitle,
  assistantSocialImage,
} from "@/features/assistant/metadata";

describe("assistant sharing metadata", () => {
  it("describes the assistant without portfolio identity or positioning", () => {
    const sharingCopy = [
      assistantBrowserTitle,
      assistantShareTitle,
      assistantDescription,
      assistantSocialImage.alt,
    ].join(" ");

    expect(sharingCopy).not.toMatch(
      /John Dean|Flick|0xFlicker|Principal Architect/i,
    );
    expect(assistantSocialImage.url).toBe("/assistant/opengraph-image");
  });
});
