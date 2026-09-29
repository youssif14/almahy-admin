import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/http";
import { caseService } from "@/lib/cases/service";

export const GET = withAuth("case:read", () =>
  NextResponse.json(caseService.lawyers(), { headers: { "Cache-Control": "private, max-age=300" } }),
);
