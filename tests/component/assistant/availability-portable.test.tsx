import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModelPreparationDialog } from "@/features/assistant/components/ModelPreparationDialog";
import { MODEL_CATALOG } from "@/features/assistant/model/modelCatalog";

describe("ModelPreparationDialog", () => {
  it("requires explicit consent and names the real model, backend, size, and capability tradeoff", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ModelPreparationDialog
        descriptor={MODEL_CATALOG[2]}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        open
        snapshot={null}
      />,
    );

    expect(screen.getByRole("heading", { name: /SmolLM2 135M/ })).toBeVisible();
    expect(screen.getByText(/WASM/)).toBeVisible();
    expect(screen.getByText(/181 MB/)).toBeVisible();
    expect(screen.getByText(/less performant/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /download and prepare/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("keeps an indeterminate preparation active and offers stop without timeout copy", () => {
    render(
      <ModelPreparationDialog
        descriptor={MODEL_CATALOG[2]}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onStop={vi.fn()}
        open
        snapshot={{
          modelKey: "smollm2-135m-wasm",
          compatibility: "offered",
          state: "preparing",
          requiredFiles: [],
          expectedBytes: null,
          loadedBytes: null,
          progress: null,
          loadedRuntimeIdentity: null,
          failure: null,
          observedAt: 1,
        }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/preparing/i);
    expect(screen.getByRole("button", { name: /stop waiting/i })).toBeVisible();
    expect(screen.queryByText(/timed out/i)).not.toBeInTheDocument();
  });
});
