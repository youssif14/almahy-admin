import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/types";

export const SESSION_COOKIE = "almahy_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // one working day

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters. Copy .env.example to .env.local.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (!payload.sub || (role !== "admin" && role !== "lawyer" && role !== "viewer")) return null;
    return { id: payload.sub, name: String(payload.name), email: String(payload.email), role };
  } catch {
    return null;
  }
}
