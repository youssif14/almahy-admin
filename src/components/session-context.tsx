"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@/types";
import { can, type Permission } from "@/lib/auth/permissions";

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSession must be used inside <SessionProvider>");
  return user;
}

/** UI-level permission check. The API enforces the same rule independently. */
export function useCan(permission: Permission) {
  return can(useSession().role, permission);
}
