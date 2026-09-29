import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { CaseForm } from "@/components/case-form/case-form";
import { requirePermission } from "@/lib/auth/dal";
import { caseService } from "@/lib/cases/service";

export const metadata: Metadata = { title: "New case" };

export default async function NewCasePage() {
  await requirePermission("case:create");
  return (
    <>
      <PageHeader title="Open a new case" description="Your answers save as a draft on this device while you work." />
      <CaseForm lawyers={caseService.lawyers()} />
    </>
  );
}
