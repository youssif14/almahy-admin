import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/dialog";

describe("ConfirmDialog", () => {
  const setup = (open = true) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open={open} title="Delete this case?" description="This can't be undone." confirmLabel="Delete case" onConfirm={onConfirm} onCancel={onCancel} />);
    return { onConfirm, onCancel };
  };

  it("is labelled by its title and description", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "Delete this case?" });
    expect(dialog).toHaveAccessibleDescription("This can't be undone.");
  });

  it("fires onConfirm only from the confirm button", async () => {
    const { onConfirm, onCancel } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Delete case" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels from the cancel and close buttons", async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("focuses Cancel first for destructive actions", () => {
    setup();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });
});
