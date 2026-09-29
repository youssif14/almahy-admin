import type { CaseStatus, Priority } from "@/types";
import { PRIORITIES, STATUSES } from "@/lib/cases/constants";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<CaseStatus, string> = {
  intake: "text-intake bg-intake/10",
  active: "text-active bg-active/10",
  "on-hold": "text-hold bg-hold/10",
  "closed-won": "text-won bg-won/10",
  "closed-lost": "text-lost bg-lost/10",
};

export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUSES[status]}
    </span>
  );
}

/** Priority reads as a bar gauge rather than another coloured pill, so it doesn't compete with status. */
const LEVEL: Record<Priority, number> = { low: 1, medium: 2, high: 3, urgent: 4 };

export function PriorityMark({ priority }: { priority: Priority }) {
  const level = LEVEL[priority];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-ink-soft">
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn("w-1 rounded-sm", i <= level ? (priority === "urgent" ? "bg-danger" : "bg-ink-soft") : "bg-line")}
            style={{ height: 4 + i * 2 }}
          />
        ))}
      </span>
      {PRIORITIES[priority]}
    </span>
  );
}
