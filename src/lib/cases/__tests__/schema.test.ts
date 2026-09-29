// @vitest-environment node
import { describe, expect, it } from "vitest";
import { bulkActionSchema, caseCreateSchema, caseUpdateSchema, toFieldErrors } from "@/lib/cases/schema";

const valid = {
  client: { type: "individual", name: "Sara Khan", email: "sara@example.com", phone: "+971 50 123 4567" },
  matter: { title: "Rental dispute", service: "legal", priority: "high", lawyerId: "law-02", summary: "Tenant is disputing the rent increase notice." },
  billing: { feeType: "fixed", amount: 5000 },
};

const errorsFor = (input: unknown) => {
  const r = caseCreateSchema.safeParse(input);
  return r.success ? {} : toFieldErrors(r.error);
};

describe("caseCreateSchema", () => {
  it("accepts a complete individual case", () => {
    expect(caseCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("requires company details only for company clients", () => {
    const errors = errorsFor({ ...valid, client: { ...valid.client, type: "company" } });
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["client.companyName", "client.tradeLicense"]));
  });

  it("requires a jurisdiction for corporate services", () => {
    const errors = errorsFor({ ...valid, matter: { ...valid.matter, service: "corporate" } });
    expect(errors["matter.jurisdiction"]).toBeDefined();
  });

  it("requires rate and hours for hourly billing, and treats empty inputs as missing", () => {
    const errors = errorsFor({ ...valid, billing: { feeType: "hourly", hourlyRate: "", estimatedHours: Number.NaN } });
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["billing.hourlyRate", "billing.estimatedHours"]));
  });

  it("rejects deadlines in the past", () => {
    const errors = errorsFor({ ...valid, matter: { ...valid.matter, deadline: "2020-01-01" } });
    expect(errors["matter.deadline"]?.[0]).toMatch(/past/);
  });

  it("coerces numeric strings from form inputs", () => {
    const r = caseCreateSchema.parse({ ...valid, billing: { feeType: "fixed", amount: "7500" } });
    expect(r.billing.amount).toBe(7500);
  });
});

describe("caseUpdateSchema", () => {
  it("requires a version for optimistic concurrency", () => {
    expect(caseUpdateSchema.safeParse({ status: "active" }).success).toBe(false);
  });
  it("rejects unknown fields (no mass assignment)", () => {
    expect(caseUpdateSchema.safeParse({ version: 1, billed: 1_000_000 }).success).toBe(false);
  });
});

describe("bulkActionSchema", () => {
  it("caps bulk operations at 100 ids", () => {
    const ids = Array.from({ length: 101 }, (_, i) => `case-${i}`);
    expect(bulkActionSchema.safeParse({ action: "delete", ids }).success).toBe(false);
  });
});
