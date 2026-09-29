// @vitest-environment node
import { describe, expect, it } from "vitest";
import { seedCases } from "@/lib/db/seed";
import { queryCases } from "@/lib/cases/query";
import { parseCaseQuery, serializeCaseQuery } from "@/lib/cases/query-params";

const NOW = Date.parse("2026-09-01T09:00:00Z");
const cases = seedCases(120, NOW);

describe("parseCaseQuery", () => {
  it("falls back to safe defaults for junk input", () => {
    const q = parseCaseQuery({ page: "-4", pageSize: "999", sort: "drop table", dir: "sideways", status: "active,bogus" });
    expect(q).toMatchObject({ page: 1, pageSize: 10, sort: "openedAt", dir: "desc", status: ["active"] });
  });

  it("round-trips through the URL serializer", () => {
    const q = parseCaseQuery({ q: "lease", status: "on-hold,active", page: "3", sort: "billed", dir: "asc" });
    expect(parseCaseQuery(new URLSearchParams(serializeCaseQuery(q)))).toEqual(q);
  });

  it("omits defaults so URLs stay short", () => {
    expect(serializeCaseQuery(parseCaseQuery({}))).toBe("");
  });
});

describe("queryCases", () => {
  it("paginates on the server side and reports totals", () => {
    const res = queryCases([...cases], parseCaseQuery({ pageSize: "20", page: "2" }));
    expect(res.data).toHaveLength(20);
    expect(res.total).toBe(120);
    expect(res.pageCount).toBe(6);
    expect(res.page).toBe(2);
  });

  it("clamps an out-of-range page to the last page", () => {
    const res = queryCases([...cases], parseCaseQuery({ page: "99" }));
    expect(res.page).toBe(res.pageCount);
  });

  it("combines multiple filters with AND, values within a filter with OR", () => {
    const res = queryCases([...cases], parseCaseQuery({ status: "active,on-hold", service: "legal", pageSize: "50" }));
    expect(res.data.length).toBeGreaterThan(0);
    for (const row of res.data) {
      expect(["active", "on-hold"]).toContain(row.status);
      expect(row.service).toBe("legal");
    }
  });

  it("searches reference, title and client fields case-insensitively", () => {
    const target = cases[7];
    const res = queryCases([...cases], parseCaseQuery({ q: target.reference.toLowerCase() }));
    expect(res.data.map((r) => r.id)).toContain(target.id);
  });

  it("sorts ascending and descending", () => {
    const asc = queryCases([...cases], parseCaseQuery({ sort: "billed", dir: "asc", pageSize: "50" })).data.map((r) => r.billed);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = queryCases([...cases], parseCaseQuery({ sort: "billed", dir: "desc", pageSize: "50" })).data.map((r) => r.billed);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it("returns list items without heavy fields", () => {
    const [row] = queryCases([...cases], parseCaseQuery({})).data;
    expect(row).not.toHaveProperty("activity");
    expect(row).toHaveProperty("documentCount");
  });
});
