/**
 * Application-wide constants and enums.
 * Shared by models, validations and UI. Keep values stable once APIs ship.
 */

/* ------------------------------- User roles ------------------------------- */
/**
 * Two-role architecture:
 * - ADMIN: Full access to admin/office portal
 * - STUDENT: Access to student portal only
 */
export const USER_ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Roles that can access the admin/office management portal. */
export const ADMIN_ROLES: readonly UserRole[] = [
  USER_ROLES.ADMIN,
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

export const LEARNING_MODES = {
  ONLINE: "online",
  HYBRID: "hybrid",
  OFFLINE: "offline",
} as const;

export type LearningMode = (typeof LEARNING_MODES)[keyof typeof LEARNING_MODES];

/* --------------------------- Enrollment lifecycle -------------------------- */
export const ENROLLMENT_STATUSES = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

export const ENROLLMENT_SOURCES = {
  RAZORPAY: "razorpay",
  ADMIN_MANUAL: "admin_manual",
  FREE_COURSE: "free_course",
} as const;

export type EnrollmentSource = (typeof ENROLLMENT_SOURCES)[keyof typeof ENROLLMENT_SOURCES];

export const ENROLLMENT_ACCESS_TYPES = {
  LIFETIME: "lifetime",
  TIME_LIMITED: "time_limited",
} as const;

export type EnrollmentAccessType =
  (typeof ENROLLMENT_ACCESS_TYPES)[keyof typeof ENROLLMENT_ACCESS_TYPES];

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

export const CERTIFICATE_TYPES = {
  COURSE_COMPLETION: "course_completion",
  INTERNSHIP: "internship",
  TRAINING_COMPLETION: "training_completion",
  /**
   * Admin-issued certificate backed by an admin-uploaded file (PDF/JPG/PNG)
   * instead of a server-generated PDF. Added for the admin Certificate
   * Management module; additive so existing rows are unaffected.
   */
  MANUAL_UPLOAD: "manual_upload",
} as const;

export type CertificateType =
  (typeof CERTIFICATE_TYPES)[keyof typeof CERTIFICATE_TYPES];

/** Certificate types whose file is uploaded by an admin rather than generated. */
export const ADMIN_UPLOADED_CERTIFICATE_TYPES: readonly CertificateType[] = [
  CERTIFICATE_TYPES.MANUAL_UPLOAD,
] as const;

/**
 * Allowed upload types for admin-issued certificate files.
 * Deliberately narrow: documents (PDF) and plain raster images only. No SVG
 * (script-capable), no archives, no executables.
 */
export const ALLOWED_CERTIFICATE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

/** Extensions that must agree with the MIME type above. */
export const ALLOWED_CERTIFICATE_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
] as const;

/** Default cap for an admin certificate upload, overridable via env. */
export const DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB = 10;

/** Grade / score is free text (e.g. "A+", "92%", "Excellent"). */
export const CERTIFICATE_GRADE_MAX_LENGTH = 60;
export const CERTIFICATE_TITLE_MAX_LENGTH = 200;
export const CERTIFICATE_NUMBER_MAX_LENGTH = 64;
export const CERTIFICATE_NOTES_MAX_LENGTH = 1000;
export const CERTIFICATE_REVOCATION_REASON_MAX_LENGTH = 500;

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
  ADMIN: "admin",
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
export const QUIZ_TYPES = {
  MODULE: "module",
  LESSON: "lesson",
  FINAL: "final",
} as const;

export type QuizType = (typeof QUIZ_TYPES)[keyof typeof QUIZ_TYPES];

export const QUIZ_ATTEMPT_STATUSES = {
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  EXPIRED: "expired",
} as const;

export type QuizAttemptStatus =
  (typeof QUIZ_ATTEMPT_STATUSES)[keyof typeof QUIZ_ATTEMPT_STATUSES];

/* --------------------------------- Lessons -------------------------------- */
export const LESSON_CONTENT_TYPES = {
  TEXT: "text",
  VIDEO: "video",
  PDF: "pdf",
} as const;

export type LessonContentType =
  (typeof LESSON_CONTENT_TYPES)[keyof typeof LESSON_CONTENT_TYPES];

/* ------------------------------- Sessions --------------------------------- */
/** A Session is a scheduled offline/venue class for a course. */
export const SESSION_STATUSES = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type SessionStatus = (typeof SESSION_STATUSES)[keyof typeof SESSION_STATUSES];

/* -------------------------------- Permissions ------------------------------ */
/**
 * Centralized permission constants.
 * Each permission follows the pattern: resource.action
 * Use these in authorization checks throughout the application.
 */
export const PERMISSIONS = {
  // Admin access
  ADMIN_ACCESS: "admin.access",

  // Student management
  STUDENTS_READ: "students.read",
  STUDENTS_UPDATE: "students.update",
  STUDENTS_STATUS: "students.status",

  // Course management
  COURSES_READ: "courses.read",
  COURSES_CREATE: "courses.create",
  COURSES_UPDATE: "courses.update",
  COURSES_PUBLISH: "courses.publish",
  COURSES_DELETE: "courses.delete",

  // Content management
  MODULES_MANAGE: "modules.manage",
  LESSONS_MANAGE: "lessons.manage",
  RESOURCES_MANAGE: "resources.manage",

  // Session (venue class) management
  SESSIONS_READ: "sessions.read",
  SESSIONS_MANAGE: "sessions.manage",

  // Assignment management
  ASSIGNMENTS_READ: "assignments.read",
  ASSIGNMENTS_MANAGE: "assignments.manage",
  ASSIGNMENTS_GRADE: "assignments.grade",

  // Institute internship and project management
  INTERNSHIPS_READ: "internships.read",
  INTERNSHIPS_MANAGE: "internships.manage",
  PROJECTS_READ: "projects.read",
  PROJECTS_MANAGE: "projects.manage",
  PROJECTS_GRADE: "projects.grade",

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
  PAYMENTS_MANAGE: "payments.manage",
  PAYMENTS_REFUND: "payments.refund",

  // Analytics
  ANALYTICS_READ: "analytics.read",

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

/** Role to permission mapping - simplified two-role authorization matrix */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_UPDATE,
    PERMISSIONS.STUDENTS_STATUS,
    PERMISSIONS.COURSES_READ,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_PUBLISH,
    PERMISSIONS.COURSES_DELETE,
    PERMISSIONS.MODULES_MANAGE,
    PERMISSIONS.LESSONS_MANAGE,
    PERMISSIONS.RESOURCES_MANAGE,
    PERMISSIONS.SESSIONS_READ,
    PERMISSIONS.SESSIONS_MANAGE,
    PERMISSIONS.ASSIGNMENTS_READ,
    PERMISSIONS.ASSIGNMENTS_MANAGE,
    PERMISSIONS.ASSIGNMENTS_GRADE,
    PERMISSIONS.INTERNSHIPS_READ,
    PERMISSIONS.INTERNSHIPS_MANAGE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.PROJECTS_GRADE,
    PERMISSIONS.QUIZZES_READ,
    PERMISSIONS.QUIZZES_MANAGE,
    PERMISSIONS.QUIZ_RESULTS_READ,
    PERMISSIONS.ENROLLMENTS_READ,
    PERMISSIONS.ENROLLMENTS_MANAGE,
    PERMISSIONS.CERTIFICATES_READ,
    PERMISSIONS.CERTIFICATES_MANAGE,
    PERMISSIONS.CERTIFICATES_REVOKE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_MANAGE,
    PERMISSIONS.PAYMENTS_REFUND,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_REPLY,
    PERMISSIONS.SUPPORT_ASSIGN,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  [USER_ROLES.STUDENT]: [],
} as const;

/** Human-readable role labels for UI display */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.STUDENT]: "Student",
  [USER_ROLES.ADMIN]: "Admin",
} as const;

/** Staff-specific account statuses (extends base ACCOUNT_STATUSES) */
export const STAFF_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type StaffStatus = (typeof STAFF_STATUSES)[keyof typeof STAFF_STATUSES];
