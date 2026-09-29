import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseDetailView } from "@/components/case-detail/case-detail-view";
import { requirePermission } from "@/lib/auth/dal";
import { caseService, DomainError } from "@/lib/cases/service";

type Params = Promise<{ id: string }>;

function load(id: string) {
  try {
    const record = caseService.get(id);
    return { case: record, related: caseService.related(record) };
  } catch (err) {
    if (err instanceof DomainError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  try {
    const c = caseService.get(id);
    return { title: `${c.reference} ${c.title}` };
  } catch {
    return { title: "Case not found" };
  }
}

/**
 * Server-rendered first paint (no loading spinner on navigation), then the
 * client takes over with TanStack Query for edits and background refresh.
 */
export default async function CasePage({ params }: { params: Params }) {
  await requirePermission("case:read");
  const { id } = await params;
  return <CaseDetailView initial={load(id)} initialLawyers={caseService.lawyers()} />;
}
