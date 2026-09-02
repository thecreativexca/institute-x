import { connectDB } from "@/lib/db/connect";
import { PERMISSIONS, type Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/session";

/** Course/content permissions used across the office Courses area (Phase 17). */
export const COURSE_PERMISSIONS = {
  READ: PERMISSIONS.COURSES_READ,
  CREATE: PERMISSIONS.COURSES_CREATE,
  UPDATE: PERMISSIONS.COURSES_UPDATE,
  PUBLISH: PERMISSIONS.COURSES_PUBLISH,
  MODULES: PERMISSIONS.MODULES_MANAGE,
  LESSONS: PERMISSIONS.LESSONS_MANAGE,
  RESOURCES: PERMISSIONS.RESOURCES_MANAGE,
} as const;

export class PermissionDeniedError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Central permission gate for server actions. The role is ALWAYS read from
 * the server session — never from client input. Hidden buttons are UX only;
 * every mutation calls this (or requireCourseScope) again server-side.
 */
export function requirePermission(
  session: SessionUser | null,
  permission: Permission
): SessionUser {
  if (!session || session.status !== "active") {
    throw new PermissionDeniedError("Please sign in to continue.");
  }
  if (!hasPermission(session.role, permission)) {
    throw new PermissionDeniedError();
  }
  return session;
}

/**
 * Admin has global content scope - no course assignment needed.
 */
function hasGlobalContentScope(role: string): boolean {
  return role === "admin";
}

/**
 * ADMIN can access all courses - no scoping needed.
 */
export async function isScopedToCourse(
  session: SessionUser,
  courseId: string
): Promise<boolean> {
  if (hasGlobalContentScope(session.role)) return true;
  // No other roles should have content management access in two-role system
  return false;
}

/**
 * Combined gate: permission + course scope. ADMIN has full access to all courses.
 */
export async function requireCourseScope(
  session: SessionUser | null,
  permission: Permission,
  courseId: string
): Promise<SessionUser> {
  const user = requirePermission(session, permission);
  const allowed = await isScopedToCourse(user, courseId);
  if (!allowed) {
    throw new PermissionDeniedError(
      "You do not have permission to manage this course."
    );
  }
  return user;
}