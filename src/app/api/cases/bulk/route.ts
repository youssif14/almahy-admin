import { NextResponse } from "next/server";
import { withAuth, problem } from "@/lib/api/http";
import { can } from "@/lib/auth/permissions";
import { caseService } from "@/lib/cases/service";
import { bulkActionSchema } from "@/lib/cases/schema";

export const POST = withAuth("case:bulk", async (req, _ctx, user) => {
  const input = bulkActionSchema.parse(await req.json());
  if (input.action === "delete" && !can(user.role, "case:delete")) return problem(403, "Only admins can delete cases.");
  if (input.action === "assign" && !can(user.role, "case:assign")) return problem(403, "Only admins can reassign cases.");
  return NextResponse.json(caseService.bulk(input, user));
});
