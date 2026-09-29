"use client";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { Lawyer } from "@/types";
import { PRIORITIES, SERVICES, STATUSES } from "@/lib/cases/constants";
import type { CaseQuery } from "@/lib/cases/query-params";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Input, Select } from "@/components/ui/input";
import { FilterMenu } from "./filter-menu";

interface Props {
  query: CaseQuery;
  lawyers: Lawyer[];
  activeFilterCount: number;
  onChange: (patch: Partial<CaseQuery>) => void;
}

export function CasesToolbar({ query, lawyers, activeFilterCount, onChange }: Props) {
  const [search, setSearch] = useState(query.q ?? "");
  const debounced = useDebouncedValue(search, 300);

  // Push the debounced search to the URL (one request per pause, not per keystroke).
  useEffect(() => {
    if ((debounced || undefined) !== query.q) onChange({ q: debounced || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debounced]);

  // Keep the box in sync when the URL changes elsewhere (back button, "Clear all").
  useEffect(() => setSearch(query.q ?? ""), [query.q]);

  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
      <div className="relative lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="case-search" className="sr-only">Search cases</label>
        <Input
          id="case-search"
          type="search"
          placeholder="Search reference, client or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu label="Status" options={STATUSES} selected={query.status} onChange={(status) => onChange({ status })} />
        <FilterMenu label="Service" options={SERVICES} selected={query.service} onChange={(service) => onChange({ service })} />
        <FilterMenu label="Priority" options={PRIORITIES} selected={query.priority} onChange={(priority) => onChange({ priority })} />
        <label htmlFor="lawyer-filter" className="sr-only">Lawyer</label>
        <Select id="lawyer-filter" value={query.lawyer ?? ""} onChange={(e) => onChange({ lawyer: e.target.value || undefined })} className="w-auto">
          <option value="">All lawyers</option>
          {lawyers.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </Select>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              onChange({ q: undefined, status: [], service: [], priority: [], lawyer: undefined });
            }}
            className="inline-flex h-10 items-center gap-1 rounded-control px-2 text-sm text-muted hover:text-ink"
          >
            <X className="size-4" aria-hidden /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}
