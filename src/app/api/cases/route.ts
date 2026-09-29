import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/http";
import { caseService } from "@/lib/cases/service";
import { parseCaseQuery } from "@/lib/cases/query-params";
import { caseCreateSchema } from "@/lib/cases/schema";

/** GET /api/cases?page=1&pageSize=10&q=&status=active,on-hold&service=&priority=&lawyer=&sort=openedAt&dir=desc */
export const GET = withAuth("case:read", (req) => {
  const result = caseService.list(parseCaseQuery(req.nextUrl.searchParams));
  return NextResponse.json(result, {
    // Per-user data: cache privately and let the client revalidate in the background.
    headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
  });
});

/** POST /api/cases — body validated with the same schema as the intake form. */
export const POST = withAuth("case:create", async (req, _ctx, user) => {
  const input = caseCreateSchema.parse(await req.json());
  const created = caseService.create(input, user);
  return NextResponse.json(created, { status: 201, headers: { Location: `/api/cases/${created.id}` } });
});
