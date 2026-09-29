import type { CaseStatus, LegalCase, Lawyer, ServiceType } from "@/types";
import { OPEN_STATUSES, SERVICES, SERVICE_KEYS, STATUSES, STATUS_KEYS } from "@/lib/cases/constants";

export interface DateRange {
  from: Date;
  to: Date; // inclusive end of day
}

export interface Kpi {
  value: number;
  previous: number;
  /** Relative change vs previous period, e.g. 0.12 = +12%. null when previous is 0. */
  change: number | null;
}

export interface Analytics {
  range: { from: string; to: string; bucket: "day" | "week" | "month" };
  kpis: { newCases: Kpi; openCases: Kpi; revenue: Kpi; winRate: Kpi; avgResolutionDays: Kpi };
  trend: { label: string; start: string; newCases: number; revenue: number; closed: number }[];
  byService: { service: ServiceType; label: string; cases: number; revenue: number }[];
  byStatus: { status: CaseStatus; label: string; count: number }[];
  workload: { lawyerId: string; name: string; open: number; urgent: number }[];
  upcomingDeadlines: { id: string; reference: string; title: string; deadline: string; priority: string }[];
}

const DAY = 86_400_000;
const inRange = (iso: string | undefined, r: DateRange) => {
  if (!iso) return false;
  const t = Date.parse(iso);
  return t >= r.from.getTime() && t <= r.to.getTime();
};

function kpi(value: number, previous: number): Kpi {
  return { value, previous, change: previous === 0 ? null : (value - previous) / previous };
}

function periodStats(cases: LegalCase[], r: DateRange) {
  const opened = cases.filter((c) => inRange(c.openedAt, r));
  const closed = cases.filter((c) => inRange(c.closedAt, r));
  const won = closed.filter((c) => c.status === "closed-won").length;
  const open = cases.filter(
    (c) => Date.parse(c.openedAt) <= r.to.getTime() && (!c.closedAt || Date.parse(c.closedAt) > r.to.getTime()),
  ).length;
  const resolution = closed.map((c) => (Date.parse(c.closedAt!) - Date.parse(c.openedAt)) / DAY);
  return {
    newCases: opened.length,
    openCases: open,
    revenue: opened.reduce((s, c) => s + c.billed, 0),
    winRate: closed.length ? Math.round((won / closed.length) * 100) : 0,
    avgResolutionDays: resolution.length ? Math.round(resolution.reduce((a, b) => a + b, 0) / resolution.length) : 0,
  };
}

export function pickBucket(r: DateRange): "day" | "week" | "month" {
  const days = (r.to.getTime() - r.from.getTime()) / DAY;
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

function bucketStart(d: Date, bucket: "day" | "week" | "month"): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  if (bucket === "week") x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); // Monday
  if (bucket === "month") x.setUTCDate(1);
  return x;
}

function nextBucket(d: Date, bucket: "day" | "week" | "month"): Date {
  const x = new Date(d);
  if (bucket === "day") x.setUTCDate(x.getUTCDate() + 1);
  else if (bucket === "week") x.setUTCDate(x.getUTCDate() + 7);
  else x.setUTCMonth(x.getUTCMonth() + 1);
  return x;
}

function bucketLabel(d: Date, bucket: "day" | "week" | "month") {
  const opts: Intl.DateTimeFormatOptions =
    bucket === "month" ? { month: "short", year: "2-digit", timeZone: "UTC" } : { day: "numeric", month: "short", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-GB", opts).format(d);
}

export function computeAnalytics(cases: LegalCase[], lawyers: Lawyer[], r: DateRange, now = new Date()): Analytics {
  const length = r.to.getTime() - r.from.getTime();
  const previous: DateRange = { from: new Date(r.from.getTime() - length - 1), to: new Date(r.from.getTime() - 1) };
  const cur = periodStats(cases, r);
  const prev = periodStats(cases, previous);

  const bucket = pickBucket(r);
  const trend: Analytics["trend"] = [];
  const index = new Map<number, Analytics["trend"][number]>();
  for (let b = bucketStart(r.from, bucket); b.getTime() <= r.to.getTime(); b = nextBucket(b, bucket)) {
    const row = { label: bucketLabel(b, bucket), start: b.toISOString(), newCases: 0, revenue: 0, closed: 0 };
    trend.push(row);
    index.set(b.getTime(), row);
  }
  const rowFor = (iso: string) => index.get(bucketStart(new Date(iso), bucket).getTime());

  const opened = cases.filter((c) => inRange(c.openedAt, r));
  for (const c of opened) {
    const row = rowFor(c.openedAt);
    if (row) {
      row.newCases += 1;
      row.revenue += c.billed;
    }
  }
  for (const c of cases) {
    if (inRange(c.closedAt, r)) {
      const row = rowFor(c.closedAt!);
      if (row) row.closed += 1;
    }
  }

  const byService = SERVICE_KEYS.map((service) => {
    const subset = opened.filter((c) => c.service === service);
    return { service, label: SERVICES[service], cases: subset.length, revenue: subset.reduce((s, c) => s + c.billed, 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  const byStatus = STATUS_KEYS.map((status) => ({
    status,
    label: STATUSES[status],
    count: opened.filter((c) => c.status === status).length,
  }));

  const openNow = cases.filter((c) => OPEN_STATUSES.includes(c.status));
  const workload = lawyers
    .map((l) => {
      const mine = openNow.filter((c) => c.lawyerId === l.id);
      return { lawyerId: l.id, name: l.name, open: mine.length, urgent: mine.filter((c) => c.priority === "urgent").length };
    })
    .sort((a, b) => b.open - a.open);

  const upcomingDeadlines = openNow
    .filter((c) => c.deadline && Date.parse(c.deadline) >= now.getTime())
    .sort((a, b) => Date.parse(a.deadline!) - Date.parse(b.deadline!))
    .slice(0, 5)
    .map((c) => ({ id: c.id, reference: c.reference, title: c.title, deadline: c.deadline!, priority: c.priority }));

  return {
    range: { from: r.from.toISOString(), to: r.to.toISOString(), bucket },
    kpis: {
      newCases: kpi(cur.newCases, prev.newCases),
      openCases: kpi(cur.openCases, prev.openCases),
      revenue: kpi(cur.revenue, prev.revenue),
      winRate: kpi(cur.winRate, prev.winRate),
      avgResolutionDays: kpi(cur.avgResolutionDays, prev.avgResolutionDays),
    },
    trend,
    byService,
    byStatus,
    workload,
    upcomingDeadlines,
  };
}

/** Parses `?from=YYYY-MM-DD&to=YYYY-MM-DD`, falling back to the last 90 days. Caps ranges at 2 years. */
export function parseRange(from?: string | null, to?: string | null, now = new Date()): DateRange {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const end = to && iso.test(to) ? new Date(`${to}T23:59:59.999Z`) : endOfDayUtc(now);
  let start = from && iso.test(from) ? new Date(`${from}T00:00:00.000Z`) : new Date(end.getTime() - 90 * DAY + 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return parseRange(undefined, undefined, now);
  }
  if (end.getTime() - start.getTime() > 731 * DAY) start = new Date(end.getTime() - 731 * DAY);
  return { from: start, to: end };
}

function endOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}
