import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/auth/jwt";
import { verifyCredentials } from "@/lib/auth/users";
import { problem } from "@/lib/api/http";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(200),
});

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(422, "Check the highlighted fields", z.flattenError(parsed.error).fieldErrors);

  const user = verifyCredentials(parsed.data.email, parsed.data.password);
  // Same message for unknown email and wrong password: don't reveal which accounts exist.
  if (!user) return problem(401, "That email and password don't match an account.");

  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
