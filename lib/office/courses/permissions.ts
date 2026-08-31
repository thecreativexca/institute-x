import { connectDB } from "@/lib/db/connect";
import { PERMISSIONS, type Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/session";
import { toObjectId } from "@/lib/utils/object-id";
import { FacultyCourseAssignment } from "@/models/FacultyCourseAssignment";
import { USER_ROLES } from "@/lib/constants";

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

/** Roles that may manage content across the whole institute. */
function hasGlobalContentScope(role: string): boolean {
  return role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.CONTENT_MANAGER;
}

/**
 * Phase 15 faculty resource scope: a FACULTY member (or any scoped role) may
 * only touch content for courses they have been explicitly assigned, even if
 * their role carries lessons.manage/modules.manage.
 */
export async function isScopedToCourse(
  session: SessionUser,
  courseId: string
): Promise<boolean> {
  if (hasGlobalContentScope(session.role)) return true;
  if (session.role !== USER_ROLES.FACULTY) return false;
  if (!/^[\da-f]{24}$/i.test(courseId)) return false;

  await connectDB();
  const assignment = await FacultyCourseAssignment.findOne({
    faculty: toObjectId(session.id),
    course: toObjectId(courseId),
  })
    .select("_id")
    .lean();
  return !!assignment;
}

/**
 * Combined gate: permission + course scope. Faculty with lessons.manage can
 * only mutate content on courses assigned to them.
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
      "You are not assigned to this course, so you cannot manage its content."
    );
  }
  return user;
}
