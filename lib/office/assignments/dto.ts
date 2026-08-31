import { AccountStatus, CourseStatus } from "@/lib/constants";

export interface OfficeAssignmentSummary {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  moduleId?: string | null;
  moduleTitle?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  dueAt: string | null;
  maxScore: number;
  isPublished: boolean;
  totalSubmissions: number;
  pendingReviews: number;
  gradedSubmissions: number;
  updatedAt: string;
}

export interface OfficeAssignmentDetail extends OfficeAssignmentSummary {
  instructions: string;
  createdAt: string;
  createdById: string;
  createdByName: string;
}

export interface OfficeSubmissionSummary {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submissionNumber: number;
  submittedAt: string;
  status: "submitted" | "graded";
  isLate: boolean;
  score: number | null;
  maxScore: number;
  feedback: string | null;
  gradedAt: string | null;
  gradedById?: string | null;
  gradedByName?: string | null;
}

export interface OfficeSubmissionDetail extends OfficeSubmissionSummary {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  content?: string | null;
  fileUrl?: string | null;
  originalFileName?: string | null;
  previousSubmissions: PreviousSubmission[];
  gradingHistory: GradingHistoryEntry[];
}

export interface PreviousSubmission {
  id: string;
  submittedAt: string;
  content?: string | null;
  fileUrl?: string | null;
  originalFileName?: string | null;
  score: number | null;
  feedback: string | null;
  status: "submitted" | "graded";
  isLate: boolean;
}

export interface GradingHistoryEntry {
  id: string;
  score: number;
  feedback: string;
  internalNote?: string | null;
  gradedById: string;
  gradedByName: string;
  gradedAt: string;
  isRegrade: boolean;
  previousScore?: number | null;
}

export interface AssignmentFilters {
  search?: string;
  courseId?: string;
  moduleId?: string;
  status?: "published" | "draft" | "all";
  deadlineFilter?: "upcoming" | "passed" | "all";
  hasPendingSubmissions?: boolean;
}

export interface AssignmentSortOptions {
  field: "updatedAt" | "dueAt" | "createdAt" | "title";
  direction: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface AssignmentListResult {
  assignments: OfficeAssignmentSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAssignmentInput {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  instructions: string;
  dueAt?: string | null;
  maxScore: number;
  isPublished?: boolean;
}

export interface UpdateAssignmentInput {
  title?: string;
  instructions?: string;
  dueAt?: string | null;
  maxScore?: number;
  moduleId?: string | null;
  lessonId?: string | null;
  isPublished?: boolean;
}

export interface GradeSubmissionInput {
  score: number;
  feedback: string;
  internalNote?: string;
  status?: "graded" | "returned_for_resubmission";
}

export interface SubmissionFilters {
  search?: string;
  status?: "pending_review" | "graded" | "late" | "returned" | "all";
}

export interface SubmissionSortOptions {
  field: "submittedAt" | "studentName" | "status" | "score";
  direction: "asc" | "desc";
}