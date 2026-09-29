import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./jwt";
import { can, type Permission } from "./permissions";

/**
 * Data Access Layer for auth. The proxy only does an optimistic redirect;
 * the real check happens here, next to the data, on every request.
 * `cache` de-duplicates the lookup within one render pass.
 */
export const getSession = cache(async () => {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (!can(session.role, permission)) redirect("/dashboard?denied=1");
  return session;
}
