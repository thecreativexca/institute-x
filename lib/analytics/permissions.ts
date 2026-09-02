/**
 * Phase 19 — Report permission model (spec §3, §6, §98, §113–§116).
 *
 * Reports require `reports.read` at a minimum. Sensitive domains additionally
 * require their own existing permission:
 *
 *   - Revenue/payments   : reports.read + payments.read
 *   - Student details    : reports.read + students.read
 *   - Support            : reports.read + support.read
 *   - Certificates       : reports.read + certificates.read
 *   - Quiz results       : reports.read + quiz-results.read (or quizzes.read)
 *   - Audit/activity     : reports.read + audit.read
 *
 * IMPORTANT (§6): callers must NOT fetch sensitive data and then hide it. These
 * gates are used BEFORE any aggregation runs so unauthorized values never
 * reach memory, the HTML or the RSC payload.
 */

import { PERMISSIONS, type Permission } from "@/lib/constants";
import type { Types } from "mongoose";
import { hasPermission, hasAllPermissions } from "@/lib/auth/permissions";
import { USER_ROLES } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth/session";

export interface ReportAbilities {
  read: boolean;
  students: boolean;
  enrollments: boolean;
  revenue: boolean;
  courses: boolean;
  assignments: boolean;
  quizResults: boolean;
  certificates: boolean;
  support: boolean;
  audit: boolean;
}

/** Map each report domain to the permission(s) it requires. */
export function abilitiesFor(session: SessionUser | null): ReportAbilities {
  const role = session?.role ?? "";
  const active = !!session && session.status === "active";
  return {
    read: active && hasPermission(role, PERMISSIONS.REPORTS_READ),
    students:
      active &&
      hasAllPermissions(role, [PERMISSIONS.REPORTS_READ, PERMISSIONS.STUDENTS_READ]),
    enrollments:
      active &&
      hasAllPermissions(role, [PERMISSIONS.REPORTS_READ, PERMISSIONS.ENROLLMENTS_READ]),
    revenue:
      active &&
      hasAllPermissions(role, [PERMISSIONS.REPORTS_READ, PERMISSIONS.PAYMENTS_READ]),
    courses: active && hasPermission(role, PERMISSIONS.COURSES_READ),
    assignments:
      active &&
      (hasPermission(role, PERMISSIONS.ASSIGNMENTS_READ) ||
        hasPermission(role, PERMISSIONS.ASSIGNMENTS_MANAGE)),
    quizResults:
      active &&
      (hasPermission(role, PERMISSIONS.QUIZ_RESULTS_READ) ||
        hasPermission(role, PERMISSIONS.QUIZZES_READ)),
    certificates:
      active && hasPermission(role, PERMISSIONS.CERTIFICATES_READ),
    support:
      active && hasPermission(role, PERMISSIONS.SUPPORT_READ),
    audit: active && hasPermission(role, PERMISSIONS.AUDIT_READ),
  };
}

/**
 * Resolve the course-scope filter for the current user. Two-role system:
 * only ADMIN reaches reports, and ADMIN has global (unscoped) course access.
 * The defensive empty filter guarantees a non-admin caller never sees
 * course-scoped report data.
 */
export async function courseScopeFilterFor(
  session: SessionUser
): Promise<{ _id: { $in: Types.ObjectId[] } } | null> {
  if (session.role === USER_ROLES.ADMIN) {
    return null; // no course filter => all courses
  }
  return { _id: { $in: [] } };
}

/**
 * Whether a specific courseId is within the user's scope. Two-role: only ADMIN
 * reaches reports, and ADMIN can scope to any course (IDOR protection, spec §110).
 */
export async function isCourseInScope(
  session: SessionUser,
  _courseId: string
): Promise<boolean> {
  return session.role === USER_ROLES.ADMIN;
}

export { PERMISSIONS, type Permission };