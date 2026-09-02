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
  _userId: string,
  _quizCourseId: string
): Promise<boolean> {
  // Two-role system: only ADMIN manages quizzes/results, with full course scope.
  return role === "admin";
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}