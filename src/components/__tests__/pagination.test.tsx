import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/cases/pagination";

describe("Pagination", () => {
  const renderAt = (page: number, pageCount = 5) => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(<Pagination page={page} pageCount={pageCount} pageSize={10} total={47} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
    return { onPageChange, onPageSizeChange };
  };

  it("shows the visible range", () => {
    renderAt(5);
    expect(screen.getByText("41–47")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last", () => {
    renderAt(1, 1);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("requests the neighbouring pages", async () => {
    const { onPageChange } = renderAt(3);
    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await userEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange.mock.calls).toEqual([[4], [2]]);
  });

  it("changes the page size", async () => {
    const { onPageSizeChange } = renderAt(1);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /rows/i }), "50");
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
