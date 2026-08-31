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
  userId: string,
  assignmentCourseId: string
): Promise<boolean> {
  if (hasPermission(role, PERMISSIONS.ASSIGNMENTS_MANAGE) || hasPermission(role, PERMISSIONS.ASSIGNMENTS_GRADE)) {
    if (role === "super_admin") return true;
    if (role === "content_manager") return true;
    if (role === "faculty") {
      const { FacultyCourseAssignment } = await import("@/models/FacultyCourseAssignment");
      const { connectDB } = await import("@/lib/db/connect");
      const { Types } = await import("mongoose");
      await connectDB();
      const assignment = await FacultyCourseAssignment.findOne({
        faculty: new Types.ObjectId(userId),
        course: new Types.ObjectId(assignmentCourseId),
      }).lean();
      return !!assignment;
    }
  }
  return false;
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}