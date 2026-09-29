"use client";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { FileSearch, Plus } from "lucide-react";
import type { CaseListItem, Lawyer } from "@/types";
import type { SortField } from "@/lib/cases/constants";
import { useCaseFilters } from "@/hooks/use-case-filters";
import { useBulkAction, useCasesList, useDeleteCase, useLawyers } from "@/hooks/use-cases";
import { useCan } from "@/components/session-context";
import { PageHeader } from "@/components/layout/app-shell";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CasesToolbar } from "./cases-toolbar";
import { CasesTable, TableSkeleton } from "./cases-table";
import { BulkBar } from "./bulk-bar";
import { Pagination } from "./pagination";

type Pending = { kind: "single"; row: CaseListItem } | { kind: "bulk" } | null;

export function CasesView({ initialLawyers }: { initialLawyers: Lawyer[] }) {
  const { query, setQuery, isPending, activeFilterCount } = useCaseFilters();
  const list = useCasesList(query);
  const { data: lawyers = initialLawyers } = useLawyers(initialLawyers);
  const lawyerMap = useMemo(() => new Map(lawyers.map((l) => [l.id, l])), [lawyers]);

  const canCreate = useCan("case:create");
  const canBulk = useCan("case:bulk");
  const canDelete = useCan("case:delete");
  const canAssign = useCan("case:assign");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<Pending>(null);
  const del = useDeleteCase();
  const bulk = useBulkAction();

  const rows = useMemo(() => list.data?.data ?? [], [list.data]);

  // A selection only makes sense for the rows on screen: reset it when the query changes.
  const queryKey = JSON.stringify(query);
  const [prevKey, setPrevKey] = useState(queryKey);
  if (queryKey !== prevKey) {
    setPrevKey(queryKey);
    setSelected(new Set());
  }
  const [now] = useState(() => Date.now()); // stable "now" for overdue checks during this visit

  const onToggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const onToggleAll = useCallback(() => {
    setSelected((prev) => (rows.every((r) => prev.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id))));
  }, [rows]);
  const onSort = useCallback(
    (field: SortField) => setQuery({ sort: field, dir: query.sort === field && query.dir === "desc" ? "asc" : "desc" }),
    [query.sort, query.dir, setQuery],
  );
  const onDeleteRow = useCallback((row: CaseListItem) => setConfirm({ kind: "single", row }), []);

  const ids = [...selected];
  const runConfirmed = () => {
    if (confirm?.kind === "single") del.mutate(confirm.row.id);
    if (confirm?.kind === "bulk") bulk.mutate({ action: "delete", ids }, { onSuccess: () => setSelected(new Set()) });
    setConfirm(null); // optimistic: close immediately, the row is already gone
  };

  const total = list.data?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Cases"
        description={list.data ? `${total} ${total === 1 ? "case matches" : "cases match"} the current filters` : "Loading cases"}
        actions={
          canCreate && (
            <Link href="/cases/new" className="inline-flex h-10 items-center gap-2 rounded-control bg-brass px-4 text-sm font-medium text-white hover:bg-brass-strong">
              <Plus className="size-4" aria-hidden /> New case
            </Link>
          )
        }
      />

      <section aria-label="Case list" className="overflow-hidden rounded-panel border border-line bg-surface">
        <CasesToolbar query={query} lawyers={lawyers} activeFilterCount={activeFilterCount} onChange={setQuery} />

        {canBulk && selected.size > 0 && (
          <BulkBar
            count={selected.size}
            lawyers={lawyers}
            canAssign={canAssign}
            canDelete={canDelete}
            busy={bulk.isPending}
            onStatus={(status) => bulk.mutate({ action: "status", ids, status }, { onSuccess: () => setSelected(new Set()) })}
            onAssign={(lawyerId) => bulk.mutate({ action: "assign", ids, lawyerId }, { onSuccess: () => setSelected(new Set()) })}
            onDelete={() => setConfirm({ kind: "bulk" })}
            onClear={() => setSelected(new Set())}
          />
        )}

        {list.isPending ? (
          <TableSkeleton rows={query.pageSize > 10 ? 10 : query.pageSize} />
        ) : list.isError ? (
          <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title={activeFilterCount ? "No cases match these filters" : "No cases yet"}
            description={activeFilterCount ? "Try removing a filter or searching for a different client." : "Open the first case to start tracking matters."}
            action={
              activeFilterCount ? (
                <Button variant="secondary" size="sm" onClick={() => setQuery({ q: undefined, status: [], service: [], priority: [], lawyer: undefined })}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          // Dim, don't blank, while the next page or filter loads.
          <div className={cn("transition-opacity", (isPending || list.isPlaceholderData) && "opacity-60")} aria-busy={isPending || list.isPlaceholderData}>
            <CasesTable
              rows={rows}
              lawyers={lawyerMap}
              query={query}
              now={now}
              selected={selected}
              canSelect={canBulk}
              canDelete={canDelete}
              onSort={onSort}
              onToggle={onToggle}
              onToggleAll={onToggleAll}
              onDelete={onDeleteRow}
            />
          </div>
        )}

        {list.data && list.data.total > 0 && (
          <div className="border-t border-line">
            <Pagination
              page={list.data.page}
              pageCount={list.data.pageCount}
              pageSize={list.data.pageSize}
              total={list.data.total}
              onPageChange={(page) => setQuery({ page })}
              onPageSizeChange={(pageSize) => setQuery({ pageSize })}
            />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "bulk" ? `Delete ${selected.size} cases?` : "Delete this case?"}
        description={
          confirm?.kind === "single" ? (
            <>
              <span className="font-medium text-ink">{confirm.row.reference}</span>, {confirm.row.title}, and its timeline will be removed permanently.
            </>
          ) : (
            "The selected cases and their timelines will be removed permanently."
          )
        }
        confirmLabel={confirm?.kind === "bulk" ? `Delete ${selected.size} cases` : "Delete case"}
        onConfirm={runConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
