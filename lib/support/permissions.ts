import { PERMISSIONS, type Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";

export const SUPPORT_PERMISSIONS = {
  READ: PERMISSIONS.SUPPORT_READ,
  REPLY: PERMISSIONS.SUPPORT_REPLY,
  ASSIGN: PERMISSIONS.SUPPORT_ASSIGN,
  MANAGE: PERMISSIONS.SUPPORT_MANAGE,
} as const;

export function canReadSupport(role: string): boolean {
  return hasPermission(role, PERMISSIONS.SUPPORT_READ);
}

export function canReplySupport(role: string): boolean {
  return hasPermission(role, PERMISSIONS.SUPPORT_REPLY);
}

export function canAssignSupport(role: string): boolean {
  return hasPermission(role, PERMISSIONS.SUPPORT_ASSIGN);
}

export function canManageSupport(role: string): boolean {
  return hasPermission(role, PERMISSIONS.SUPPORT_MANAGE);
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}