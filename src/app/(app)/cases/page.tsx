import type { Metadata } from "next";
import { Suspense } from "react";
import { CasesView } from "@/components/cases/cases-view";
import { TableSkeleton } from "@/components/cases/cases-table";
import { requirePermission } from "@/lib/auth/dal";
import { caseService } from "@/lib/cases/service";

export const metadata: Metadata = { title: "Cases" };

/**
 * The list is a Client Component driven by the URL and TanStack Query:
 * filtering and paging re-fetch only JSON, never the whole page.
 * The server still does the auth check and seeds the lawyer list.
 */
export default async function CasesPage() {
  await requirePermission("case:read");
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CasesView initialLawyers={caseService.lawyers()} />
    </Suspense>
  );
}
