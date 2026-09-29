import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/http";
import { caseService } from "@/lib/cases/service";

/** GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD */
export const GET = withAuth("analytics:read", (req) => {
  const sp = req.nextUrl.searchParams;
  return NextResponse.json(caseService.analytics(sp.get("from"), sp.get("to")), {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
  });
});
