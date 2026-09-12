import { AccountStatus, UserRole, EnrollmentStatus, PaymentStatus, CertificateStatus } from "@/lib/constants";

export interface OfficeStudentSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: AccountStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  enrollmentCounts: {
    total: number;
    active: number;
    completed: number;
  };
}

export interface OfficeStudentDetail extends OfficeStudentSummary {
  lastLoginAt: string | null;
  lastOfficeLoginAt: string | null;
  avatarUrl?: string | null;
}

export interface StudentEnrollment {
  id: string;
  courseId: string;
  courseName: string;
  courseSlug: string;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  enrolledAt: string;
  completedAt: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
}

export interface StudentProgressCourse {
  courseId: string;
  courseName: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  moduleProgress: Array<{
    moduleId: string;
    moduleTitle: string;
    completedLessons: number;
    totalLessons: number;
    percent: number;
    status: "not_started" | "in_progress" | "completed";
  }>;
  lastActivityAt: string | null;
}

export interface StudentAssignment {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  submissionNumber: number;
  submittedAt: string;
  status: "submitted" | "graded";
  score: number | null;
  maxScore: number;
  feedback: string | null;
  isLate: boolean;
}

export interface StudentQuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseName: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  status: "in_progress" | "submitted" | "expired";
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
}

export interface StudentPayment {
  id: string;
  courseId: string;
  courseName: string;
  amount: number;
  currency: string;
  provider: string;
  receiptNumber: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface StudentCertificate {
  id: string;
  certificateNumber: string;
  /** Empty for admin-issued certificates that are not tied to a course. */
  courseId: string;
  /** Certificate title when set, otherwise the course name snapshot. */
  courseName: string;
  issuedAt: string;
  /** Null when the certificate records no completion date. */
  completionDate: string | null;
  status: CertificateStatus;
  verificationCode: string;
  pdfUrl: string;
  issuedBy?: string;
}

export interface StudentActivityEvent {
  id: string;
  type: "account_created" | "enrollment_created" | "lesson_completed" | "assignment_submitted" | "quiz_completed" | "payment_completed" | "course_completed" | "certificate_issued" | "status_changed";
  description: string;
  timestamp: string;
  courseId?: string;
  courseName?: string;
  metadata?: Record<string, unknown>;
}

export interface StudentFilters {
  search?: string;
  status?: AccountStatus | "ALL";
  emailVerified?: "verified" | "unverified" | "ALL";
  hasEnrollment?: boolean;
  courseId?: string;
  joinedFrom?: string;
  joinedTo?: string;
}

export interface StudentSortOptions {
  field: "createdAt" | "name" | "lastLoginAt" | "enrollmentCount";
  direction: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface StudentListResult {
  students: OfficeStudentSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentStatusAction {
  studentId: string;
  status: AccountStatus;
  reason?: string;
}

export interface ManualEnrollmentInput {
  studentId: string;
  courseId: string;
  source: "ONLINE_PAYMENT" | "FREE" | "MANUAL" | "ADMIN_GRANTED";
  reason?: string;
  enrolledBy: string;
}

export interface ProfileUpdateInput {
  name?: string;
  phone?: string;
  email?: string;
}