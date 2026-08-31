/**
 * Application-wide constants and enums.
 * Shared by models, validations and UI. Keep values stable once APIs ship.
 */

/* ------------------------------- User roles ------------------------------- */
/**
 * Foundational role architecture only.
 * Full RBAC/permission matrix is implemented in a later phase.
 */
export const USER_ROLES = {
  STUDENT: "student",
  SUPER_ADMIN: "super_admin",
  OFFICE_STAFF: "office_staff",
  CONTENT_MANAGER: "content_manager",
  FACULTY: "faculty",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Roles that can access the office/admin management portal. */
export const OFFICE_ROLES: readonly UserRole[] = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.OFFICE_STAFF,
  USER_ROLES.CONTENT_MANAGER,
  USER_ROLES.FACULTY,
] as const;

/* ---------------------------- Account statuses ----------------------------- */
export const ACCOUNT_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[keyof typeof ACCOUNT_STATUSES];

/* ------------------------------ Course fields ------------------------------ */
export const COURSE_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
  ALL_LEVELS: "all_levels",
} as const;

export type CourseLevel = (typeof COURSE_LEVELS)[keyof typeof COURSE_LEVELS];

export const COURSE_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type CourseStatus = (typeof COURSE_STATUSES)[keyof typeof COURSE_STATUSES];

/* --------------------------- Enrollment lifecycle -------------------------- */
export const ENROLLMENT_STATUSES = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

export const PAYMENT_STATUSES = {
  CREATED: "created",
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const PAYMENT_PROVIDERS = {
  RAZORPAY: "razorpay",
  FREE: "free",
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

/* -------------------------------- Progress --------------------------------- */
export const PROGRESS_STATUSES = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export type ProgressStatus = (typeof PROGRESS_STATUSES)[keyof typeof PROGRESS_STATUSES];

/* ------------------------------ Submissions -------------------------------- */
/**
 * Lifecycle of an assignment submission. `late` is intentionally NOT a stored
 * status — it is derived from `submittedAt` vs the assignment `dueAt` so it can
 * never go stale when due dates change.
 */
export const SUBMISSION_STATUSES = {
  SUBMITTED: "submitted",
  GRADED: "graded",
} as const;

export type SubmissionStatus =
  (typeof SUBMISSION_STATUSES)[keyof typeof SUBMISSION_STATUSES];

/* ------------------------------- Certificates ------------------------------ */
export const CERTIFICATE_STATUSES = {
  ISSUED: "issued",
  REVOKED: "revoked",
} as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[keyof typeof CERTIFICATE_STATUSES];

/**
 * Certificate issuance kinds (Phase 12 focuses on course completion, but the
 * model supports future training/internship/workshop types without a schema
 * change).
 */
export const CERTIFICATE_TYPES = {
  COURSE_COMPLETION: "course_completion",
  TRAINING_COMPLETION: "training_completion",
} as const;

export type CertificateType =
  (typeof CERTIFICATE_TYPES)[keyof typeof CERTIFICATE_TYPES];

/* --------------------------------- Tickets --------------------------------- */
export const TICKET_STATUSES = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_FOR_STUDENT: "waiting_for_student",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

export const TICKET_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES];

export const TICKET_CATEGORIES = {
  COURSE_ACCESS: "course_access",
  PAYMENT: "payment",
  TECHNICAL: "technical",
  ASSIGNMENT: "assignment",
  QUIZ: "quiz",
  CERTIFICATE: "certificate",
  ACCOUNT: "account",
  OTHER: "other",
} as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[keyof typeof TICKET_CATEGORIES];

/* ------------------------------- Announcements ----------------------------- */
export const AUDIENCES = {
  ALL: "all",
  STUDENTS: "students",
  STAFF: "staff",
} as const;

export type Audience = (typeof AUDIENCES)[keyof typeof AUDIENCES];

/* ------------------------------- Resources -------------------------------- */
export const RESOURCE_TYPES = {
  PDF: "pdf",
  DOCUMENT: "document",
  OTHER: "other",
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];

export const RESOURCE_ACCESS = {
  VIEW_AND_DOWNLOAD: "view_and_download",
  VIEW_ONLY: "view_only",
  PRIVATE: "private",
} as const;

export type ResourceAccess = (typeof RESOURCE_ACCESS)[keyof typeof RESOURCE_ACCESS];

/** Allowed MIME types for resource uploads. */
export const ALLOWED_RESOURCE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

/* --------------------------------- Quizzes -------------------------------- */
/**
 * Quiz types supported by the Phase 10 quiz engine.
 * Values are lower-case to match the enum style used across the codebase.
 */
export const QUIZ_TYPES = {
  MODULE: "module",
  LESSON: "lesson",
  FINAL: "final",
} as const;

export type QuizType = (typeof QUIZ_TYPES)[keyof typeof QUIZ_TYPES];

/** Lifecycle of a single student attempt. */
export const QUIZ_ATTEMPT_STATUSES = {
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  EXPIRED: "expired",
} as const;

export type QuizAttemptStatus =
  (typeof QUIZ_ATTEMPT_STATUSES)[keyof typeof QUIZ_ATTEMPT_STATUSES];

/* -------------------------------- Permissions ------------------------------ */
/**
 * Centralized permission constants.
 * Each permission follows the pattern: resource.action
 * Use these in authorization checks throughout the application.
 */
export const PERMISSIONS = {
  // Office access
  OFFICE_ACCESS: "office.access",

  // Staff management
  STAFF_READ: "staff.read",
  STAFF_CREATE: "staff.create",
  STAFF_UPDATE: "staff.update",
  STAFF_ACTIVATE: "staff.activate",
  STAFF_SUSPEND: "staff.suspend",

  // Student management
  STUDENTS_READ: "students.read",
  STUDENTS_UPDATE: "students.update",
  STUDENTS_STATUS: "students.status",

  // Course management
  COURSES_READ: "courses.read",
  COURSES_CREATE: "courses.create",
  COURSES_UPDATE: "courses.update",
  COURSES_PUBLISH: "courses.publish",

  // Content management
  MODULES_MANAGE: "modules.manage",
  LESSONS_MANAGE: "lessons.manage",
  RESOURCES_MANAGE: "resources.manage",

  // Assignment management
  ASSIGNMENTS_READ: "assignments.read",
  ASSIGNMENTS_MANAGE: "assignments.manage",
  ASSIGNMENTS_GRADE: "assignments.grade",

  // Quiz management
  QUIZZES_READ: "quizzes.read",
  QUIZZES_MANAGE: "quizzes.manage",
  QUIZ_RESULTS_READ: "quiz-results.read",

  // Enrollment management
  ENROLLMENTS_READ: "enrollments.read",
  ENROLLMENTS_MANAGE: "enrollments.manage",

  // Certificate management
  CERTIFICATES_READ: "certificates.read",
  CERTIFICATES_MANAGE: "certificates.manage",
  CERTIFICATES_REVOKE: "certificates.revoke",

  // Payment management
  PAYMENTS_READ: "payments.read",

  // Announcement management
  ANNOUNCEMENTS_MANAGE: "announcements.manage",

  // Support management
  SUPPORT_READ: "support.read",
  SUPPORT_REPLY: "support.reply",
  SUPPORT_ASSIGN: "support.assign",
  SUPPORT_MANAGE: "support.manage",

  // Reports
  REPORTS_READ: "reports.read",
  AUDIT_READ: "audit.read",

  // Settings
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Role to permission mapping - centralized authorization matrix */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [USER_ROLES.SUPER_ADMIN]: [
    PERMISSIONS.OFFICE_ACCESS,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_ACTIVATE,
    PERMISSIONS.STAFF_SUSPEND,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.STUDENTS_STATUS,
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_PUBLISH,
    PERMISSIONS.MODULES_MANAGE,
    PERMISSIONS.LESSONS_MANAGE,
    PERMISSIONS.RESOURCES_MANAGE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_MANAGE,
    PERMISSIONS.ASSIGNMENTS_GRADE,
    PERMISSIONS.QUIZZES_READ,
    PERMISSIONS.QUIZZES_MANAGE,
    PERMISSIONS.QUIZ_RESULTS_READ,
    PERMISSIONS.ENROLLMENTS_READ,
    PERMISSIONS.ENROLLMENTS_MANAGE,
    PERMISSIONS.CERTIFICATES_READ,
    PERMISSIONS.CERTIFICATES_MANAGE,
    PERMISSIONS.CERTIFICATES_REVOKE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.SUPPORT_ASSIGN,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  [USER_ROLES.OFFICE_STAFF]: [
    PERMISSIONS.OFFICE_ACCESS,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.ENROLLMENTS_READ,
    PERMISSIONS.ENROLLMENTS_MANAGE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.CERTIFICATES_READ,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.SUPPORT_ASSIGN,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.REPORTS_READ,
  ],
  [USER_ROLES.CONTENT_MANAGER]: [
    PERMISSIONS.OFFICE_ACCESS,
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_PUBLISH,
    PERMISSIONS.MODULES_MANAGE,
    PERMISSIONS.LESSONS_MANAGE,
    PERMISSIONS.RESOURCES_MANAGE,
    PERMISSIONS.ASSIGNMENTS_MANAGE,
    PERMISSIONS.QUIZZES_MANAGE,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.REPORTS_READ,
  ],
  [USER_ROLES.FACULTY]: [
    PERMISSIONS.OFFICE_ACCESS,
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_GRADE,
    PERMISSIONS.QUIZZES_READ,
    PERMISSIONS.QUIZ_RESULTS_READ,
    PERMISSIONS.REPORTS_READ,
  ],
  [USER_ROLES.STUDENT]: [],
} as const;

/** Human-readable role labels for UI display */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.STUDENT]: "Student",
  [USER_ROLES.SUPER_ADMIN]: "Super Admin",
  [USER_ROLES.OFFICE_STAFF]: "Office Staff",
  [USER_ROLES.CONTENT_MANAGER]: "Content Manager",
  [USER_ROLES.FACULTY]: "Faculty",
} as const;

/** Staff-specific account statuses (extends base ACCOUNT_STATUSES) */
export const STAFF_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type StaffStatus = (typeof STAFF_STATUSES)[keyof typeof STAFF_STATUSES];

