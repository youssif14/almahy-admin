import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import type { SessionUser } from "@/types";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";
import { can, type Permission } from "@/lib/auth/permissions";
import { DomainError } from "@/lib/cases/service";
import { toFieldErrors } from "@/lib/cases/schema";

export function problem(status: number, error: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ error, ...(fieldErrors ? { fieldErrors } : {}) }, { status });
}

const latency = () => Number(process.env.SIMULATED_LATENCY_MS ?? 250);
const errorRate = () => Number(process.env.SIMULATED_ERROR_RATE ?? 0);

type Handler<C> = (req: NextRequest, ctx: C, user: SessionUser) => Promise<Response> | Response;

/**
 * Wraps a route handler with: authentication, role check, optional demo
 * latency / failure injection, and consistent JSON error responses.
 */
export function withAuth<C>(permission: Permission, handler: Handler<C>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    const user = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!user) return problem(401, "Your session has expired. Sign in again.");
    if (!can(user.role, permission)) return problem(403, "Your role doesn't allow this action.");

    if (latency() > 0) await new Promise((r) => setTimeout(r, latency()));
    if (req.method !== "GET" && Math.random() < errorRate()) {
      return problem(503, "The server couldn't save this change. Try again.");
    }

    try {
      return await handler(req, ctx, user);
    } catch (err) {
      if (err instanceof DomainError) return problem(err.status, err.message, err.fieldErrors);
      if (err instanceof ZodError) return problem(422, "Check the highlighted fields", toFieldErrors(err));
      if (err instanceof SyntaxError) return problem(400, "The request body isn't valid JSON");
      console.error("[api]", err);
      return problem(500, "Something failed on the server. Try again.");
    }
  };
}
