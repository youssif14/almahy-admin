import { z } from "zod";
import { PAGE_SIZES, PRIORITY_KEYS, SERVICE_KEYS, SORT_FIELDS, STATUS_KEYS } from "./constants";

/**
 * Single source of truth for list filters. The same schema parses the
 * browser URL (client) and the API query string (server), so the URL,
 * the cache key and the database query can never drift apart.
 */
const csvEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .string()
    .optional()
    .transform((raw) =>
      (raw ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter((v): v is T => (values as readonly string[]).includes(v)),
    );

export const caseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(10),
  q: z.string().trim().max(100).optional().catch(undefined),
  status: csvEnum(STATUS_KEYS),
  service: csvEnum(SERVICE_KEYS),
  priority: csvEnum(PRIORITY_KEYS),
  lawyer: z.string().regex(/^law-\d{2}$/).optional().catch(undefined),
  sort: z.enum(SORT_FIELDS).catch("openedAt"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
});

export type CaseQuery = z.infer<typeof caseQuerySchema>;

export function parseCaseQuery(params: URLSearchParams | Record<string, string | undefined>): CaseQuery {
  const entries = params instanceof URLSearchParams ? Object.fromEntries(params.entries()) : params;
  return caseQuerySchema.parse(entries);
}

/** Serialises a query back to a compact, stable query string (defaults omitted). */
export function serializeCaseQuery(query: Partial<CaseQuery>): string {
  const sp = new URLSearchParams();
  if (query.q) sp.set("q", query.q);
  if (query.status?.length) sp.set("status", [...query.status].sort().join(","));
  if (query.service?.length) sp.set("service", [...query.service].sort().join(","));
  if (query.priority?.length) sp.set("priority", [...query.priority].sort().join(","));
  if (query.lawyer) sp.set("lawyer", query.lawyer);
  if (query.sort && query.sort !== "openedAt") sp.set("sort", query.sort);
  if (query.dir && query.dir !== "desc") sp.set("dir", query.dir);
  if (query.pageSize && query.pageSize !== 10) sp.set("pageSize", String(query.pageSize));
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  return sp.toString();
}
