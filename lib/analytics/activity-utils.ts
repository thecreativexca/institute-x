/**
 * Phase 19 — Audit utility functions (pure, no server actions).
 * These are separated from activity.ts to avoid "Server Actions must be async" errors.
 */

export const AUDIT_ACTION_GROUPS: Record<string, string[]> = {
  Authentication: [
    "office.login",
    "office.logout",
    "office.password_reset",
    "office.password_reset_request",
    "office.password_change",
    "office.profile_update",
  ],
  "Staff management": [
    "staff.create",
    "staff.update",
    "staff.activate",
    "staff.suspend",
    "staff.role_change",
    "staff.invite",
  ],
  "Student management": ["student.suspend", "student.update", "enrollment.manage"],
  Courses: [
    "course.create",
    "course.update",
    "course.publish",
    "course.unpublish",
    "course.archive",
    "course.delete",
    "course.thumbnail_update",
  ],
  Content: [
    "module.create",
    "module.update",
    "module.delete",
    "module.reorder",
    "lesson.create",
    "lesson.update",
    "lesson.delete",
    "lesson.reorder",
    "resource.upload",
    "resource.update",
    "resource.delete",
  ],
  Certificates: ["certificate.revoke"],
  Settings: ["settings.update"],
};

const GROUP_INDEX: Record<string, string> = {};
for (const [group, actions] of Object.entries(AUDIT_ACTION_GROUPS)) {
  for (const a of actions) GROUP_INDEX[a] = group;
}

export function auditGroupFor(action: string): string {
  return GROUP_INDEX[action] ?? "Other";
}

const SAFE_KEYS = new Set([
  "status",
  "previousStatus",
  "fromStatus",
  "toStatus",
  "from",
  "to",
  "grade",
  "score",
  "title",
  "courseName",
  "courseTitle",
  "reason",
  "entityType",
  "enrollmentStatus",
]);

/** Build a safe, human-readable summary from audit metadata (spec §73). */
export function summarizeAudit(
  action: string,
  metadata?: Record<string, unknown>
): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return action.replace(/\./g, " ");
  }
  const parts: string[] = [];
  const push = (label: string, value: unknown) => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      parts.push(`${label}: ${value}`);
    }
  };
  for (const key of SAFE_KEYS) {
    if (key in metadata) push(key, metadata[key]);
  }
  return parts.length > 0 ? parts.join(" · ") : action.replace(/\./g, " ");
}