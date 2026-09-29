import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/http";

export const GET = withAuth("case:read", (_req, _ctx, user) => NextResponse.json({ user }));
