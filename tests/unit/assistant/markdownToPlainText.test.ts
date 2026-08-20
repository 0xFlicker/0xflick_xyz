import { describe, expect, it } from "vitest";

import { markdownToPlainText } from "@/features/assistant/content/markdownToPlainText";

describe("markdownToPlainText", () => {
  it("removes Markdown syntax while preserving readable content", () => {
    expect(
      markdownToPlainText(
        "## Helpful answer\n\nUse **bold**, _emphasis_, and [named links](https://example.com).\n\n- First item\n- Second item",
      ),
    ).toBe(
      "Helpful answer Use bold, emphasis, and named links. First item Second item",
    );
  });

  it("omits hidden HTML and image markup from announcements", () => {
    expect(
      markdownToPlainText(
        "Visible text\n\n<img src='https://example.com/tracker'>\n\n![hidden image](https://example.com/image.png)",
      ),
    ).toBe("Visible text");
  });

  it("preserves punctuation that belongs to inline and fenced code", () => {
    expect(
      markdownToPlainText("Use `user_id`, then:\n\n```ts\nconst ok = value !== null;\n```"),
    ).toBe("Use user_id, then: const ok = value !== null;");
  });
});
