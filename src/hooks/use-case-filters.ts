"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { parseCaseQuery, serializeCaseQuery, type CaseQuery } from "@/lib/cases/query-params";

/**
 * The URL is the state. Filters, sort and page live in the query string, so
 * views are shareable, survive refresh, and work with back/forward.
 */
export function useCaseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = useMemo(() => parseCaseQuery(new URLSearchParams(searchParams.toString())), [searchParams]);

  const setQuery = useCallback(
    (patch: Partial<CaseQuery>, { resetPage = true } = {}) => {
      const next = { ...query, ...patch, ...(resetPage && !("page" in patch) ? { page: 1 } : {}) };
      const qs = serializeCaseQuery(next);
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [query, pathname, router],
  );

  const activeFilterCount = query.status.length + query.service.length + query.priority.length + (query.lawyer ? 1 : 0) + (query.q ? 1 : 0);

  return { query, setQuery, isPending, activeFilterCount };
}
