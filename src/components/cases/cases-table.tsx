"use client";
import Link from "next/link";
import { memo } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from "lucide-react";
import type { CaseListItem, Lawyer } from "@/types";
import type { CaseQuery } from "@/lib/cases/query-params";
import type { SortField } from "@/lib/cases/constants";
import { SERVICES } from "@/lib/cases/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatAED, formatDate } from "@/lib/utils";
import { PriorityMark, StatusBadge } from "./badges";

interface TableProps {
  rows: CaseListItem[];
  lawyers: Map<string, Lawyer>;
  query: CaseQuery;
  selected: Set<string>;
  canSelect: boolean;
  canDelete: boolean;
  onSort: (field: SortField) => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onDelete: (row: CaseListItem) => void;
}

const COLUMNS: { field?: SortField; label: string; className?: string }[] = [
  { field: "reference", label: "Case" },
  { field: "client", label: "Client", className: "hidden md:table-cell" },
  { label: "Status" },
  { field: "priority", label: "Priority", className: "hidden lg:table-cell" },
  { label: "Lawyer", className: "hidden xl:table-cell" },
  { field: "deadline", label: "Deadline", className: "hidden sm:table-cell" },
  { field: "billed", label: "Billed", className: "hidden lg:table-cell text-right" },
];

export function CasesTable({ rows, lawyers, query, selected, canSelect, canDelete, onSort, onToggle, onToggleAll, onDelete }: TableProps) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selected.has(r.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="sr-only">Cases, sorted by {query.sort} {query.dir === "asc" ? "ascending" : "descending"}</caption>
        <thead className="border-b border-line bg-paper/60 text-left text-xs text-muted">
          <tr>
            {canSelect && (
              <th scope="col" className="w-10 px-4 py-2.5">
                <Checkbox aria-label="Select all cases on this page" checked={allSelected} indeterminate={someSelected} onChange={onToggleAll} />
              </th>
            )}
            {COLUMNS.map((col) => {
              const active = col.field === query.sort;
              const Icon = !active ? ArrowUpDown : query.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={col.label}
                  scope="col"
                  aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn("px-4 py-2.5 font-medium", col.className)}
                >
                  {col.field ? (
                    <button type="button" onClick={() => onSort(col.field!)} className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}>
                      {col.label}
                      <Icon className={cn("size-3.5", !active && "opacity-40")} aria-hidden />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
            {canDelete && <th scope="col" className="w-12 px-2"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <Row
              key={row.id}
              row={row}
              lawyer={lawyers.get(row.lawyerId)}
              checked={selected.has(row.id)}
              canSelect={canSelect}
              canDelete={canDelete}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Memoised so toggling one checkbox re-renders one row, not the whole page. */
const Row = memo(function Row({
  row,
  lawyer,
  checked,
  canSelect,
  canDelete,
  onToggle,
  onDelete,
}: {
  row: CaseListItem;
  lawyer?: Lawyer;
  checked: boolean;
  canSelect: boolean;
  canDelete: boolean;
  onToggle: (id: string) => void;
  onDelete: (row: CaseListItem) => void;
}) {
  const overdue = row.deadline && Date.parse(row.deadline) < Date.now() && !row.status.startsWith("closed");
  return (
    <tr className={cn("transition-colors hover:bg-paper/70", checked && "bg-brass-soft/50 hover:bg-brass-soft/70")}>
      {canSelect && (
        <td className="px-4 py-3">
          <Checkbox aria-label={`Select ${row.reference}`} checked={checked} onChange={() => onToggle(row.id)} />
        </td>
      )}
      <td className="max-w-[18rem] px-4 py-3">
        <Link href={`/cases/${row.id}`} className="block truncate font-medium text-ink hover:underline">
          {row.title}
        </Link>
        <span className="text-xs text-muted">{row.reference}, {SERVICES[row.service]}</span>
      </td>
      <td className="hidden max-w-[14rem] px-4 py-3 md:table-cell">
        <span className="block truncate">{row.client.companyName ?? row.client.name}</span>
        {row.client.companyName && <span className="block truncate text-xs text-muted">{row.client.name}</span>}
      </td>
      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
      <td className="hidden px-4 py-3 lg:table-cell"><PriorityMark priority={row.priority} /></td>
      <td className="hidden px-4 py-3 text-ink-soft xl:table-cell">{lawyer?.name ?? "Unassigned"}</td>
      <td className={cn("hidden whitespace-nowrap px-4 py-3 sm:table-cell", overdue ? "font-medium text-danger" : "text-ink-soft")}>
        {formatDate(row.deadline)}
        {overdue && <span className="sr-only"> (overdue)</span>}
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 text-right lg:table-cell">{formatAED(row.billed)}</td>
      {canDelete && (
        <td className="px-2 py-3">
          <button type="button" onClick={() => onDelete(row)} className="rounded p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${row.reference}`}>
            <Trash2 className="size-4" />
          </button>
        </td>
      )}
    </tr>
  );
});

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="divide-y divide-line">
      <span className="sr-only">Loading cases</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="size-4" />
          <div className="flex-1">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-4 w-32 md:block" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}
