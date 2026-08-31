import { ROLE_PERMISSIONS, type Permission, type UserRole, PERMISSIONS } from "@/lib/constants";

export { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/constants";
export type { Permission, UserRole } from "@/lib/constants";

function permissionsForRole(role: string): readonly Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? [];
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

/**
 * Check if a role has any of the specified permissions.
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions.
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: string): readonly Permission[] {
  return permissionsForRole(role);
}

/**
 * Check if a role can access the office portal.
 */
export function canAccessOffice(role: string): boolean {
  return hasPermission(role, PERMISSIONS.OFFICE_ACCESS);
}

/**
 * True when the role is an office-side staff role (not a student).
 */
export function isOfficeRole(role: string): boolean {
  return (
    role === "super_admin" ||
    role === "office_staff" ||
    role === "content_manager" ||
    role === "faculty"
  );
}

/**
 * True when the role is a student role.
 */
export function isStudent(role: string): boolean {
  return role === "student";
}

/**
 * Get human-readable label for a permission.
 */
export function getPermissionLabel(permission: Permission): string {
  const parts = permission.split(".");
  if (parts.length !== 2) return permission;
  const [resource, action] = parts;
  return `${resource.charAt(0).toUpperCase() + resource.slice(1)}: ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

/**
 * Check if a user session has a specific permission.
 * This is the main authorization function for server-side checks.
 */
export function sessionHasPermission(
  session: { role: string; status: string } | null,
  permission: Permission
): boolean {
  if (!session || session.status !== "active") return false;
  return hasPermission(session.role, permission);
}

/**
 * Check if a user session can access the office portal.
 */
export function sessionCanAccessOffice(session: { role: string; status: string } | null): boolean {
  return sessionHasPermission(session, PERMISSIONS.OFFICE_ACCESS);
}