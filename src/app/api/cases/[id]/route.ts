import { NextResponse } from "next/server";
import { withAuth, problem } from "@/lib/api/http";
import { can } from "@/lib/auth/permissions";
import { caseService } from "@/lib/cases/service";
import { caseUpdateSchema } from "@/lib/cases/schema";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth<Ctx>("case:read", async (_req, { params }) => {
  const record = caseService.get((await params).id);
  return NextResponse.json({ case: record, related: caseService.related(record) });
});

export const PATCH = withAuth<Ctx>("case:update", async (req, { params }, user) => {
  const input = caseUpdateSchema.parse(await req.json());
  // Field-level rule: only admins may reassign a case.
  if (input.lawyerId && !can(user.role, "case:assign")) return problem(403, "Only admins can reassign cases.");
  return NextResponse.json(caseService.update((await params).id, input, user));
});

export const DELETE = withAuth<Ctx>("case:delete", async (_req, { params }) => {
  caseService.remove((await params).id);
  return new NextResponse(null, { status: 204 });
});
