import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Analytics, Kpi } from "@/lib/analytics/compute";
import { cn, formatAED } from "@/lib/utils";

interface Item {
  label: string;
  kpi: Kpi;
  format: (n: number) => string;
  /** For metrics where lower is better (resolution time), invert the colour. */
  lowerIsBetter?: boolean;
  note: string;
}

export function KpiCards({ kpis }: { kpis: Analytics["kpis"] }) {
  const items: Item[] = [
    { label: "Fees billed", kpi: kpis.revenue, format: formatAED, note: "on matters opened in this period" },
    { label: "New cases", kpi: kpis.newCases, format: String, note: "opened in this period" },
    { label: "Open caseload", kpi: kpis.openCases, format: String, note: "at the end of the period" },
    { label: "Win rate", kpi: kpis.winRate, format: (n) => `${n}%`, note: "of cases closed in this period" },
    { label: "Time to close", kpi: kpis.avgResolutionDays, format: (n) => `${n} days`, lowerIsBetter: true, note: "average, closed cases" },
  ];

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-panel border border-line bg-surface sm:grid-cols-3 xl:grid-cols-5">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "border-line p-5",
            i === 0 && "col-span-2 sm:col-span-1 bg-brass-soft/60",
            "border-b sm:border-b-0 xl:border-r last:border-r-0",
          )}
        >
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd className="mt-2 font-serif text-3xl leading-none text-ink">{item.format(item.kpi.value)}</dd>
          <dd className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <Delta kpi={item.kpi} lowerIsBetter={item.lowerIsBetter} />
            <span>{item.note}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Delta({ kpi, lowerIsBetter }: { kpi: Kpi; lowerIsBetter?: boolean }) {
  if (kpi.change === null) return <span className="font-medium">New</span>;
  const up = kpi.change >= 0;
  const good = lowerIsBetter ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const pct = `${Math.abs(kpi.change * 100).toFixed(0)}%`;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-won" : "text-lost")}>
      <Icon className="size-3.5" aria-hidden />
      <span className="sr-only">{up ? "Up" : "Down"}</span>
      {pct}
      <span className="sr-only"> vs previous period</span>
    </span>
  );
}
