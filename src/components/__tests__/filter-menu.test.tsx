import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterMenu } from "@/components/cases/filter-menu";

const OPTIONS = { active: "Active", "on-hold": "On hold", intake: "Intake" };

describe("FilterMenu", () => {
  it("opens, toggles values and reports the new selection", async () => {
    const onChange = vi.fn();
    render(<FilterMenu label="Status" options={OPTIONS} selected={["active"]} onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: /status/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(screen.getByRole("checkbox", { name: "On hold" }));
    expect(onChange).toHaveBeenLastCalledWith(["active", "on-hold"]);
    await userEvent.click(screen.getByRole("checkbox", { name: "Active" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<FilterMenu label="Status" options={OPTIONS} selected={[]} onChange={() => {}} />);
    const trigger = screen.getByRole("button", { name: /status/i });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("checkbox", { name: "Intake" }));
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });
});
