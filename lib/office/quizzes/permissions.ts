import { PERMISSIONS, type Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";

export const QUIZ_PERMISSIONS = {
  READ: PERMISSIONS.QUIZZES_READ,
  MANAGE: PERMISSIONS.QUIZZES_MANAGE,
  RESULTS_READ: PERMISSIONS.QUIZ_RESULTS_READ,
} as const;

export function canReadQuizzes(role: string): boolean {
  return hasPermission(role, PERMISSIONS.QUIZZES_READ);
}

export function canManageQuizzes(role: string): boolean {
  return hasPermission(role, PERMISSIONS.QUIZZES_MANAGE);
}

export function canReadQuizResults(role: string): boolean {
  return hasPermission(role, PERMISSIONS.QUIZ_RESULTS_READ);
}

export async function canAccessQuiz(
  role: string,
  userId: string,
  quizCourseId: string
): Promise<boolean> {
  if (hasPermission(role, PERMISSIONS.QUIZZES_MANAGE) || hasPermission(role, PERMISSIONS.QUIZ_RESULTS_READ)) {
    if (role === "super_admin") return true;
    if (role === "content_manager") return true;
    if (role === "faculty") {
      const { FacultyCourseAssignment } = await import("@/models/FacultyCourseAssignment");
      const { connectDB } = await import("@/lib/db/connect");
      const { Types } = await import("mongoose");
      await connectDB();
      const assignment = await FacultyCourseAssignment.findOne({
        faculty: new Types.ObjectId(userId),
        course: new Types.ObjectId(quizCourseId),
      }).lean();
      return !!assignment;
    }
  }
  return false;
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}