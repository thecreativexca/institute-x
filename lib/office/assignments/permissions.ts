import { PERMISSIONS, type Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";

export const ASSIGNMENT_PERMISSIONS = {
  READ: PERMISSIONS.ASSIGNMENTS_READ,
  MANAGE: PERMISSIONS.ASSIGNMENTS_MANAGE,
  GRADE: PERMISSIONS.ASSIGNMENTS_GRADE,
} as const;

export function canReadAssignments(role: string): boolean {
  return hasPermission(role, PERMISSIONS.ASSIGNMENTS_READ);
}

export function canManageAssignments(role: string): boolean {
  return hasPermission(role, PERMISSIONS.ASSIGNMENTS_MANAGE);
}

export function canGradeAssignments(role: string): boolean {
  return hasPermission(role, PERMISSIONS.ASSIGNMENTS_GRADE);
}

export async function canAccessAssignment(
  role: string,
  _userId: string,
  _assignmentCourseId: string
): Promise<boolean> {
  // Two-role system: only ADMIN manages/grades assignments, with full course scope.
  return role === "admin";
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}