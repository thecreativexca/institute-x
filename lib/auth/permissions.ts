import { USER_ROLES, type Permission, PERMISSIONS } from "@/lib/constants";

export { PERMISSIONS, ROLE_LABELS, ADMIN_ROLES, ROLE_PERMISSIONS } from "@/lib/constants";
export type { Permission, UserRole } from "@/lib/constants";

/**
 * Two-role authorization kernel.
 *
 * The application has exactly two roles: ADMIN and STUDENT.
 * - ADMIN holds every permission (full management portal).
 * - STUDENT (and any other/legacy value) holds none.
 *
 * These helpers are intentionally role-only (no fine-grained matrix). The
 * legacy symbolic permission surface is retained so existing call sites keep
 * compiling, but every check reduces to "is this user an active ADMIN?".
 */

function isAdminRole(role: string): boolean {
  return role === USER_ROLES.ADMIN;
}

/** True only for the ADMIN role. */
export function isAdmin(role: string): boolean {
  return isAdminRole(role);
}

/** True only for the STUDENT role. */
export function isStudent(role: string): boolean {
  return role === USER_ROLES.STUDENT;
}

/** Whether a role is an office/admin-capable role (two-role: only ADMIN). */
export function isOfficeRole(role: string): boolean {
  return isAdminRole(role);
}

/**
 * Two-role: only ADMIN has a permission. `permission` is ignored — ADMIN can do
 * everything a management action requires.
 */
export function hasPermission(role: string, _permission: Permission): boolean {
  return isAdminRole(role);
}

export function hasAnyPermission(role: string, _permissions: Permission[]): boolean {
  return isAdminRole(role);
}

export function hasAllPermissions(role: string, _permissions: Permission[]): boolean {
  return isAdminRole(role);
}

export function getPermissionsForRole(role: string): readonly Permission[] {
  return isAdminRole(role) ? Object.values(PERMISSIONS) : [];
}

/** Whether a role can access the admin/office portal. */
export function canAccessAdmin(role: string): boolean {
  return isAdminRole(role);
}

/** Alias kept for existing call sites. */
export function canAccessOffice(role: string): boolean {
  return isAdminRole(role);
}

/** Human-readable label for a permission (metadata only). */
export function getPermissionLabel(permission: Permission): string {
  const parts = permission.split(".");
  if (parts.length !== 2) return permission;
  const [resource, action] = parts;
  return `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

/** Session-level gate: authenticated, active, and (for admin checks) ADMIN. */
export function sessionHasPermission(
  session: { role: string; status: string } | null,
  _permission: Permission
): boolean {
  return !!session && session.status === "active" && isAdminRole(session.role);
}

export function sessionCanAccessAdmin(
  session: { role: string; status: string } | null
): boolean {
  return !!session && session.status === "active" && isAdminRole(session.role);
}
