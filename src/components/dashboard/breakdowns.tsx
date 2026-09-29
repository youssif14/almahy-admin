import Link from "next/link";
import type { Analytics } from "@/lib/analytics/compute";
import type { CaseStatus } from "@/types";
import { PriorityMark } from "@/components/cases/badges";
import { formatDate, relativeDays } from "@/lib/utils";

const STATUS_BAR: Record<CaseStatus, string> = {
  intake: "bg-intake",
  active: "bg-active",
  "on-hold": "bg-hold",
  "closed-won": "bg-won",
  "closed-lost": "bg-lost",
};

export function StatusBreakdown({ data }: { data: Analytics["byStatus"] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="text-sm text-muted">No cases were opened in this period.</p>;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-line" aria-hidden>
        {data.map((d) => d.count > 0 && <div key={d.status} className={STATUS_BAR[d.status]} style={{ width: `${(d.count / total) * 100}%` }} />)}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between gap-2">
            <Link href={`/cases?status=${d.status}`} className="flex items-center gap-2 hover:underline">
              <span className={`size-2 rounded-full ${STATUS_BAR[d.status]}`} aria-hidden />
              {d.label}
            </Link>
            <span className="text-muted">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Workload({ data }: { data: Analytics["workload"] }) {
  const max = Math.max(1, ...data.map((d) => d.open));
  return (
    <ul className="flex flex-col gap-3">
      {data.map((d) => (
        <li key={d.lawyerId}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <Link href={`/cases?lawyer=${d.lawyerId}&status=active,intake,on-hold`} className="truncate hover:underline">
              {d.name}
            </Link>
            <span className="shrink-0 text-muted">
              {d.open} open{d.urgent > 0 && <span className="text-danger">, {d.urgent} urgent</span>}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-sage" style={{ width: `${(d.open / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function UpcomingDeadlines({ data }: { data: Analytics["upcomingDeadlines"] }) {
  if (!data.length) return <p className="text-sm text-muted">No open cases have a deadline coming up.</p>;
  return (
    <ol className="divide-y divide-line">
      {data.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <Link href={`/cases/${d.id}`} className="block truncate text-sm font-medium hover:underline">
              {d.title}
            </Link>
            <p className="text-xs text-muted">{d.reference}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm">{formatDate(d.deadline, { day: "numeric", month: "short" })}</p>
            <p className="text-xs text-muted">{relativeDays(d.deadline)}</p>
          </div>
          <span className="hidden sm:block"><PriorityMark priority={d.priority} /></span>
        </li>
      ))}
    </ol>
  );
}
