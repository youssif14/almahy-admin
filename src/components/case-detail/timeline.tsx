import { ArrowRightLeft, FilePlus2, FolderOpen, MessageSquare, PencilLine, UserRoundCheck } from "lucide-react";
import type { ActivityEntry } from "@/types";
import { formatDateTime } from "@/lib/utils";

const ICONS: Record<ActivityEntry["kind"], typeof FolderOpen> = {
  created: FolderOpen,
  status: ArrowRightLeft,
  assigned: UserRoundCheck,
  update: PencilLine,
  note: MessageSquare,
  document: FilePlus2,
};

export function Timeline({ entries }: { entries: ActivityEntry[] }) {
  if (!entries.length) return <p className="text-sm text-muted">No activity recorded yet.</p>;
  return (
    <ol className="relative flex flex-col gap-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-line">
      {entries.map((e) => {
        const Icon = ICONS[e.kind];
        return (
          <li key={e.id} className="relative flex gap-3 animate-fade">
            <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft" aria-hidden>
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 pt-1">
              <p className={e.kind === "note" ? "rounded-control bg-paper px-3 py-2 text-sm" : "text-sm"}>{e.message}</p>
              <p className="mt-0.5 text-xs text-muted">
                {e.actor}, <time dateTime={e.at}>{formatDateTime(e.at)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
