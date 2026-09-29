import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ServiceChart, TrendChart } from "@/components/dashboard/lazy-charts";
import { StatusBreakdown, UpcomingDeadlines, Workload } from "@/components/dashboard/breakdowns";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Panel } from "@/components/ui/panel";
import { requirePermission } from "@/lib/auth/dal";
import { parseRange } from "@/lib/analytics/compute";
import { caseService } from "@/lib/cases/service";
import { formatDate, toDateInput } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

type SP = Promise<{ from?: string; to?: string; denied?: string }>;

/**
 * Server Component: analytics are computed next to the data and streamed as
 * HTML. Only the date filter and the charts ship JavaScript to the browser.
 */
export default async function DashboardPage({ searchParams }: { searchParams: SP }) {
  const user = await requirePermission("analytics:read");
  const sp = await searchParams;
  const range = parseRange(sp.from, sp.to);
  const from = toDateInput(range.from);
  const to = toDateInput(range.to);

  return (
    <>
      <PageHeader
        title={`Good ${greeting()}, ${user.name.split(" ")[0]}`}
        description={`Practice performance from ${formatDate(range.from.toISOString())} to ${formatDate(range.to.toISOString())}, compared with the period before.`}
        actions={<DateRangeFilter from={from} to={to} />}
      />
      {sp.denied && (
        <p role="alert" className="mb-6 rounded-control border border-hold/30 bg-hold/5 px-4 py-2 text-sm text-hold">
          Your role doesn&apos;t have access to that page, so you were brought back here.
        </p>
      )}
      {/* Keyed by range so a new range shows the skeleton instead of stale numbers. */}
      <Suspense key={`${from}_${to}`} fallback={<DashboardSkeleton />}>
        <DashboardContent from={from} to={to} />
      </Suspense>
    </>
  );
}

async function DashboardContent({ from, to }: { from: string; to: string }) {
  const data = caseService.analytics(from, to);
  const bucketName = { day: "day", week: "week", month: "month" }[data.range.bucket];

  return (
    <div className="flex flex-col gap-6">
      <KpiCards kpis={data.kpis} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Intake and billing" description={`New cases and fees billed per ${bucketName}`}>
          <TrendChart data={data.trend} />
        </Panel>
        <Panel title="Fees by service" description="Which practice areas bring in the most">
          <ServiceChart data={data.byService} />
        </Panel>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Where new cases stand" description="Current status of cases opened in this period">
          <StatusBreakdown data={data.byStatus} />
        </Panel>
        <Panel title="Lawyer workload" description="Open cases right now">
          <Workload data={data.workload} />
        </Panel>
        <Panel title="Next deadlines" description="Open cases, soonest first">
          <UpcomingDeadlines data={data.upcomingDeadlines} />
        </Panel>
      </div>
    </div>
  );
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Dubai" }).format(new Date()));
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
