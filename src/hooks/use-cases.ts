"use client";
import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CaseListItem, CaseStatus, LegalCase, Lawyer, Paginated } from "@/types";
import { api, ApiError } from "@/lib/api/client";
import { serializeCaseQuery, type CaseQuery } from "@/lib/cases/query-params";
import type { BulkActionInput, CaseCreateValues, CaseUpdateInput } from "@/lib/cases/schema";

type CaseDetail = { case: LegalCase; related: CaseListItem[] };
type List = Paginated<CaseListItem>;

/** Query-key factory: one place defines cache identity, so invalidation is precise. */
export const caseKeys = {
  all: ["cases"] as const,
  lists: () => [...caseKeys.all, "list"] as const,
  list: (q: CaseQuery) => [...caseKeys.lists(), serializeCaseQuery(q)] as const,
  detail: (id: string) => [...caseKeys.all, "detail", id] as const,
  lawyers: ["lawyers"] as const,
};

const fetchList = (q: CaseQuery, signal?: AbortSignal) => api<List>(`/api/cases?${serializeCaseQuery(q)}`, { signal });

export function useCasesList(query: CaseQuery) {
  const qc = useQueryClient();
  const result = useQuery({
    queryKey: caseKeys.list(query),
    queryFn: ({ signal }) => fetchList(query, signal),
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads
  });

  // Prefetch the next page so paging forward feels instant.
  const pageCount = result.data?.pageCount ?? 0;
  const hasNext = !result.isPlaceholderData && query.page < pageCount;
  useEffect(() => {
    if (!hasNext) return;
    const next = { ...query, page: query.page + 1 };
    void qc.prefetchQuery({ queryKey: caseKeys.list(next), queryFn: ({ signal }) => fetchList(next, signal), staleTime: 30_000 });
  }, [hasNext, query, qc]);
  return result;
}

export function useCase(id: string, initialData?: CaseDetail) {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: ({ signal }) => api<CaseDetail>(`/api/cases/${id}`, { signal }),
    initialData, // hydrated from the Server Component, so no loading flash on first paint
    staleTime: 15_000,
  });
}

export function useLawyers(initialData?: Lawyer[]) {
  return useQuery({ queryKey: caseKeys.lawyers, queryFn: () => api<Lawyer[]>("/api/lawyers"), initialData, staleTime: 5 * 60_000 });
}

/* ----------------------------- mutations ----------------------------- */

function patchLists(qc: QueryClient, fn: (row: CaseListItem) => CaseListItem | null) {
  qc.setQueriesData<List>({ queryKey: caseKeys.lists() }, (old) => {
    if (!old) return old;
    const data = old.data.map(fn).filter((r): r is CaseListItem => r !== null);
    return { ...old, data, total: old.total - (old.data.length - data.length) };
  });
}

function errorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : "Something went wrong. Try again.";
}

/**
 * Optimistic update: apply the change to every cached copy immediately,
 * roll back on error, then re-sync with the server either way.
 */
export function useUpdateCase(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CaseUpdateInput, "version">) => {
      const current = qc.getQueryData<CaseDetail>(caseKeys.detail(id));
      return api<LegalCase>(`/api/cases/${id}`, { method: "PATCH", json: { ...input, version: current?.case.version ?? 1 } });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: caseKeys.detail(id) });
      const previousDetail = qc.getQueryData<CaseDetail>(caseKeys.detail(id));
      const previousLists = qc.getQueriesData<List>({ queryKey: caseKeys.lists() });
      if (previousDetail) {
        const { note: _note, client, deadline, ...rest } = input;
        qc.setQueryData<CaseDetail>(caseKeys.detail(id), {
          ...previousDetail,
          case: {
            ...previousDetail.case,
            ...rest,
            ...(deadline !== undefined ? { deadline: deadline ?? undefined } : {}),
            client: { ...previousDetail.case.client, ...client },
          } as LegalCase,
        });
      }
      patchLists(qc, (row) => (row.id === id ? ({ ...row, ...(input.status ? { status: input.status } : {}), ...(input.priority ? { priority: input.priority } : {}) } as CaseListItem) : row));
      return { previousDetail, previousLists };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previousDetail) qc.setQueryData(caseKeys.detail(id), ctx.previousDetail);
      ctx?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errorMessage(err), err instanceof ApiError && err.status === 409 ? { action: { label: "Reload", onClick: () => qc.invalidateQueries({ queryKey: caseKeys.detail(id) }) } } : undefined);
    },
    onSuccess: (updated) => {
      qc.setQueryData<CaseDetail>(caseKeys.detail(id), (old) => (old ? { ...old, case: updated } : old));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: caseKeys.lists() }),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/cases/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: caseKeys.lists() });
      const previousLists = qc.getQueriesData<List>({ queryKey: caseKeys.lists() });
      patchLists(qc, (row) => (row.id === id ? null : row));
      return { previousLists };
    },
    onError: (err, _id, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errorMessage(err));
    },
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: caseKeys.detail(id) });
      toast.success("Case deleted");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: caseKeys.lists() }),
  });
}

export function useBulkAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkActionInput) => api<{ affected: number }>("/api/cases/bulk", { method: "POST", json: input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: caseKeys.lists() });
      const previousLists = qc.getQueriesData<List>({ queryKey: caseKeys.lists() });
      const ids = new Set(input.ids);
      patchLists(qc, (row) => {
        if (!ids.has(row.id)) return row;
        if (input.action === "delete") return null;
        if (input.action === "status") return { ...row, status: input.status as CaseStatus };
        return { ...row, lawyerId: input.lawyerId };
      });
      return { previousLists };
    },
    onError: (err, _input, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errorMessage(err));
    },
    onSuccess: ({ affected }, input) => {
      const verb = input.action === "delete" ? "Deleted" : input.action === "status" ? "Updated" : "Reassigned";
      toast.success(`${verb} ${affected} ${affected === 1 ? "case" : "cases"}`);
      input.ids.forEach((id) => qc.invalidateQueries({ queryKey: caseKeys.detail(id) }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: caseKeys.lists() }),
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CaseCreateValues) => api<LegalCase>("/api/cases", { method: "POST", json: input }),
    onSuccess: (created) => {
      qc.setQueryData<CaseDetail>(caseKeys.detail(created.id), { case: created, related: [] });
      return qc.invalidateQueries({ queryKey: caseKeys.lists() });
    },
  });
}
