import { PERMISSIONS, type Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";

export const ANNOUNCEMENT_PERMISSIONS = {
  MANAGE: PERMISSIONS.ANNOUNCEMENTS_MANAGE,
} as const;

export function canManageAnnouncements(role: string): boolean {
  return hasPermission(role, PERMISSIONS.ANNOUNCEMENTS_MANAGE);
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}