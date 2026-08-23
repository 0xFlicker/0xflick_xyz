import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModelManager } from "@/features/assistant/components/ModelManager";
import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";
import type { LocalModelOption } from "@/features/assistant/types";

const installed: LocalModelOption = {
  descriptor: MODEL_CATALOG[2],
  active: true,
  pending: false,
  asset: {
    modelKey: "smollm2-135m-wasm",
    compatibility: "offered",
    state: "ready",
    requiredFiles: [],
    expectedBytes: 181_000_000,
    loadedBytes: 181_000_000,
    progress: 1,
    loadedRuntimeIdentity: "runtime",
    failure: null,
    observedAt: 1,
  },
};

describe("ModelManager", () => {
  it("keeps removal separate, scoped, confirmed, and keyboard operable", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<ModelManager onClose={vi.fn()} onRemove={onRemove} open options={[installed]} />);
    expect(screen.getByText(/stored separately from chats/i)).toBeVisible();
    expect(screen.getByText(/SmolLM2 135M/)).toBeVisible();
    expect(screen.getByText(/181 MB/)).toBeVisible();
    const removeButton = screen.getByRole("button", { name: "Remove" });
    await user.click(removeButton);
    expect(screen.getByText(/Chats and model boundaries remain/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(removeButton).toHaveFocus();
    await user.click(removeButton);
    await user.click(screen.getByRole("button", { name: "Remove model" }));
    expect(onRemove).toHaveBeenCalledWith("smollm2-135m-wasm");
  });
});
