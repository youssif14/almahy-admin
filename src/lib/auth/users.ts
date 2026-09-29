import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { SessionUser } from "@/types";

/** Seeded demo accounts. Passwords are never stored in the repo — see DEMO_PASSWORD. */
export const DEMO_USERS: SessionUser[] = [
  { id: "usr-admin", name: "Almahy Mohamed", email: "admin@almahy.demo", role: "admin" },
  { id: "usr-lawyer", name: "Rania Haddad", email: "lawyer@almahy.demo", role: "lawyer" },
  { id: "usr-viewer", name: "Front desk", email: "viewer@almahy.demo", role: "viewer" },
];

export function verifyCredentials(email: string, password: string): SessionUser | null {
  const expected = process.env.DEMO_PASSWORD;
  if (!expected) throw new Error("DEMO_PASSWORD is not configured.");
  const user = DEMO_USERS.find((u) => u.email === email.trim().toLowerCase());
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  // Constant-time comparison; compare even when the user is unknown to avoid timing leaks.
  const match = a.length === b.length && timingSafeEqual(a, b);
  return user && match ? user : null;
}
