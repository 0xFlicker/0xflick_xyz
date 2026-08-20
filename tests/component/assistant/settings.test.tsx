import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsDialog } from "@/features/assistant/components/SettingsDialog";

const blank = { key: "personality" as const, revision: 0, text: "", updatedAt: 0 };

describe("SettingsDialog", () => {
  it("starts blank, reports Unicode code points, saves, and can clear", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    render(<SettingsDialog onSave={onSave} personality={blank} />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    const field = screen.getByLabelText("Personality preference");
    expect(field).toHaveValue("");
    expect(screen.getByText("0 / 1,000")).toBeVisible();
    await user.type(field, "Warm 🪩");
    expect(screen.getByText("6 / 1,000")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Save preference" }));
    expect(onSave).toHaveBeenCalledWith("Warm 🪩");
    expect(screen.getByText("Preference saved")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Clear field" }));
    await user.click(screen.getByRole("button", { name: "Save preference" }));
    expect(onSave).toHaveBeenLastCalledWith("");
  });

  it("blocks 1,001 code points without replacing the prior value and closes with Escape", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    render(
      <SettingsDialog
        onSave={onSave}
        personality={{ ...blank, revision: 1, text: "Keep this" }}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Settings" });
    await user.click(trigger);
    const field = screen.getByLabelText("Personality preference");
    await user.clear(field);
    await user.type(field, "x".repeat(1_001));
    expect(screen.getByText("1,001 / 1,000")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save preference" })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Assistant settings" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
