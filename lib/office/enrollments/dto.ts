import type { EnrollmentAccessType, EnrollmentSource, EnrollmentStatus } from "@/lib/constants";

export interface EnrollmentListItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  accessType: EnrollmentAccessType;
  enrolledAt: string;
  expiresAt: string | null;
  completedAt: string | null;
}

export interface EnrollmentListResult {
  enrollments: EnrollmentListItem[];
  total: number;
  page: number;
  totalPages: number;
  summary: { total: number; active: number; completed: number; expiredOrCancelled: number };
}

export interface EnrollmentCourseOption { id: string; name: string }

export interface EnrollmentActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}
