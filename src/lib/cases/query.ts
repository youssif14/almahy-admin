import type { CaseListItem, LegalCase, Paginated, Priority } from "@/types";
import type { CaseQuery } from "./query-params";

const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2, urgent: 3 };

export function toListItem({ activity: _a, summary: _s, documents, ...rest }: LegalCase): CaseListItem {
  return { ...rest, documentCount: documents.length };
}

function matchesSearch(c: LegalCase, q: string) {
  const needle = q.toLowerCase();
  return [c.reference, c.title, c.client.name, c.client.email, c.client.companyName ?? ""].some((field) =>
    field.toLowerCase().includes(needle),
  );
}

function compare(a: LegalCase, b: LegalCase, sort: CaseQuery["sort"]): number {
  switch (sort) {
    case "reference":
      return a.reference.localeCompare(b.reference);
    case "client":
      return (a.client.companyName ?? a.client.name).localeCompare(b.client.companyName ?? b.client.name);
    case "billed":
      return a.billed - b.billed;
    case "priority":
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case "deadline":
      // Cases without a deadline always sink to the end.
      return (a.deadline ? Date.parse(a.deadline) : Infinity) - (b.deadline ? Date.parse(b.deadline) : Infinity);
    case "openedAt":
    default:
      return Date.parse(a.openedAt) - Date.parse(b.openedAt);
  }
}

/** Pure filter → sort → paginate pipeline. This is what a SQL query would do in production. */
export function queryCases(all: LegalCase[], query: CaseQuery): Paginated<CaseListItem> {
  const filtered = all.filter(
    (c) =>
      (!query.q || matchesSearch(c, query.q)) &&
      (!query.status.length || query.status.includes(c.status)) &&
      (!query.service.length || query.service.includes(c.service)) &&
      (!query.priority.length || query.priority.includes(c.priority)) &&
      (!query.lawyer || c.lawyerId === query.lawyer),
  );

  const direction = query.dir === "asc" ? 1 : -1;
  const sorted = filtered.sort((a, b) => compare(a, b, query.sort) * direction || a.id.localeCompare(b.id));

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;

  return {
    data: sorted.slice(start, start + query.pageSize).map(toListItem),
    page,
    pageSize: query.pageSize,
    total,
    pageCount,
  };
}

/** Other matters for the same client (by company, else by email). */
export function findRelatedCases(all: LegalCase[], target: LegalCase, limit = 5): CaseListItem[] {
  const key = target.client.companyName ?? target.client.email;
  return all
    .filter((c) => c.id !== target.id && (c.client.companyName ?? c.client.email) === key)
    .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))
    .slice(0, limit)
    .map(toListItem);
}
