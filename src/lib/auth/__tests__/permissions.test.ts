// @vitest-environment node
import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/permissions";

describe("role permissions", () => {
  it("lets admins do everything", () => {
    expect(can("admin", "case:delete")).toBe(true);
    expect(can("admin", "case:assign")).toBe(true);
  });
  it("lets lawyers edit but not delete or reassign", () => {
    expect(can("lawyer", "case:update")).toBe(true);
    expect(can("lawyer", "case:delete")).toBe(false);
    expect(can("lawyer", "case:assign")).toBe(false);
  });
  it("keeps viewers read-only", () => {
    expect(can("viewer", "case:read")).toBe(true);
    expect(can("viewer", "case:create")).toBe(false);
    expect(can("viewer", "case:bulk")).toBe(false);
  });
  it("denies when there is no session", () => {
    expect(can(null, "case:read")).toBe(false);
  });
});
