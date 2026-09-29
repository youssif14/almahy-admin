// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { LegalCase } from "@/types";
import { computeAnalytics, parseRange, pickBucket } from "@/lib/analytics/compute";
import { LAWYERS, seedCases } from "@/lib/db/seed";

const make = (over: Partial<LegalCase>): LegalCase => ({ ...seedCases(1)[0], ...over });

describe("parseRange", () => {
  const now = new Date("2026-09-29T10:00:00Z");
  it("defaults to the last 90 days", () => {
    const r = parseRange(undefined, undefined, now);
    expect(Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000)).toBe(90);
  });
  it("ignores inverted or malformed ranges", () => {
    const r = parseRange("2026-09-10", "2026-01-01", now);
    expect(r.to.toISOString().slice(0, 10)).toBe("2026-09-29");
  });
});

describe("pickBucket", () => {
  it("chooses a sensible granularity", () => {
    const d = (s: string) => new Date(s);
    expect(pickBucket({ from: d("2026-09-01"), to: d("2026-09-20") })).toBe("day");
    expect(pickBucket({ from: d("2026-06-01"), to: d("2026-09-01") })).toBe("week");
    expect(pickBucket({ from: d("2025-09-01"), to: d("2026-09-01") })).toBe("month");
  });
});

describe("computeAnalytics", () => {
  const range = { from: new Date("2026-08-01T00:00:00Z"), to: new Date("2026-08-31T23:59:59Z") };
  const cases = [
    make({ id: "a", openedAt: "2026-08-05T10:00:00Z", billed: 1000, status: "closed-won", closedAt: "2026-08-20T10:00:00Z" }),
    make({ id: "b", openedAt: "2026-08-10T10:00:00Z", billed: 3000, status: "closed-lost", closedAt: "2026-08-25T10:00:00Z" }),
    make({ id: "c", openedAt: "2026-07-10T10:00:00Z", billed: 2000, status: "active", closedAt: undefined }),
  ];

  it("computes KPIs and the change against the previous period", () => {
    const a = computeAnalytics(cases, LAWYERS, range);
    expect(a.kpis.newCases.value).toBe(2);
    expect(a.kpis.newCases.previous).toBe(1);
    expect(a.kpis.newCases.change).toBeCloseTo(1); // +100%
    expect(a.kpis.revenue.value).toBe(4000);
    expect(a.kpis.winRate.value).toBe(50);
    expect(a.kpis.avgResolutionDays.value).toBe(15);
  });

  it("fills every bucket so charts have no gaps", () => {
    const a = computeAnalytics(cases, LAWYERS, range);
    expect(a.trend).toHaveLength(31);
    expect(a.trend.reduce((s, t) => s + t.newCases, 0)).toBe(2);
  });

  it("reports null change when there is nothing to compare with", () => {
    const a = computeAnalytics([], LAWYERS, range);
    expect(a.kpis.revenue.change).toBeNull();
  });
});
