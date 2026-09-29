import type { Role } from "@/types";

/**
 * Role-based access control. The UI uses `can()` to hide actions, and every
 * API route calls it again — hiding a button is UX, the server check is security.
 */
export type Permission =
  | "case:read"
  | "case:create"
  | "case:update"
  | "case:assign"
  | "case:delete"
  | "case:bulk"
  | "analytics:read";

const MATRIX: Record<Role, readonly Permission[]> = {
  admin: ["case:read", "case:create", "case:update", "case:assign", "case:delete", "case:bulk", "analytics:read"],
  lawyer: ["case:read", "case:create", "case:update", "case:bulk", "analytics:read"],
  viewer: ["case:read", "analytics:read"],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  return !!role && MATRIX[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  lawyer: "Lawyer",
  viewer: "Read-only",
};
