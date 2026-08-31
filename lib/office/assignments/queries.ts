import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { FacultyCourseAssignment } from "@/models/FacultyCourseAssignment";
import { AuditLog } from "@/models/AuditLog";
import { Types } from "mongoose";
import {
  OfficeAssignmentSummary,
  OfficeAssignmentDetail,
  OfficeSubmissionSummary,
  OfficeSubmissionDetail,
  PreviousSubmission,
  GradingHistoryEntry,
  AssignmentFilters,
  AssignmentSortOptions,
  PaginationParams,
  AssignmentListResult,
} from "./dto";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/constants";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getUserCourseScope(userId: string, role: string): Promise<Types.ObjectId[] | null> {
  if (role === "super_admin" || role === "content_manager" || role === "office_staff") {
    return null;
  }
  if (role === "faculty") {
    const assignments = await FacultyCourseAssignment.find({ faculty: toObjectId(userId) })
      .select("course")
      .lean();
    return assignments.map((a) => a.course);
  }
  return [];
}

export async function getOfficeAssignments(
  filters: AssignmentFilters,
  sort: AssignmentSortOptions,
  pagination: PaginationParams,
  userId: string,
  role: string
): Promise<AssignmentListResult> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const courseScope = await getUserCourseScope(userId, role);

  const query: Record<string, unknown> = {};

  if (courseScope) {
    if (courseScope.length === 0) {
      return {
        assignments: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
    query.course = { $in: courseScope };
  }

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    query.title = regex;
  }

  if (filters.courseId && Types.ObjectId.isValid(filters.courseId)) {
    query.course = toObjectId(filters.courseId);
  }

  if (filters.moduleId && Types.ObjectId.isValid(filters.moduleId)) {
    query.module = toObjectId(filters.moduleId);
  }

  if (filters.status === "published") {
    query.isPublished = true;
  } else if (filters.status === "draft") {
    query.isPublished = false;
  }

  if (filters.deadlineFilter === "upcoming") {
    query.dueAt = { $gte: new Date() };
  } else if (filters.deadlineFilter === "passed") {
    query.dueAt = { $lt: new Date() };
  }

  const sortField = sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate([
        { path: "course", select: "name" },
        { path: "module", select: "title" },
        { path: "lesson", select: "title" },
      ])
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Assignment.countDocuments(query),
  ]);

  if (assignments.length === 0) {
    return {
      assignments: [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const assignmentIds = assignments.map((a) => a._id);

  const submissionAggregation = await Submission.aggregate<{
    _id: Types.ObjectId;
    total: number;
    pending: number;
    graded: number;
  }>([
    { $match: { assignment: { $in: assignmentIds } } },
    {
      $group: {
        _id: "$assignment",
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", SUBMISSION_STATUSES.SUBMITTED] }, 1, 0] } },
        graded: { $sum: { $cond: [{ $eq: ["$status", SUBMISSION_STATUSES.GRADED] }, 1, 0] } },
      },
    },
  ]);

  const submissionStats = new Map(
    submissionAggregation.map((s) => [
      s._id.toString(),
      { total: s.total, pending: s.pending, graded: s.graded },
    ])
  );

  const assignmentSummaries: OfficeAssignmentSummary[] = assignments.map((assignment) => {
    const stats = submissionStats.get(assignment._id.toString()) ?? {
      total: 0,
      pending: 0,
      graded: 0,
    };
    const course = assignment.course as unknown as { _id: Types.ObjectId; name: string };
    const moduleDoc = assignment.module as unknown as { _id: Types.ObjectId; title: string } | null;
    const lesson = assignment.lesson as unknown as { _id: Types.ObjectId; title: string } | null;

    return {
      id: assignment._id.toString(),
      title: assignment.title,
      courseId: course._id.toString(),
      courseName: course.name,
      moduleId: moduleDoc?._id.toString() ?? null,
      moduleTitle: moduleDoc?.title ?? null,
      lessonId: lesson?._id.toString() ?? null,
      lessonTitle: lesson?.title ?? null,
      dueAt: assignment.dueAt?.toISOString() ?? null,
      maxScore: assignment.maxScore,
      isPublished: assignment.isPublished,
      totalSubmissions: stats.total,
      pendingReviews: stats.pending,
      gradedSubmissions: stats.graded,
      updatedAt: assignment.updatedAt.toISOString(),
    };
  });

  return {
    assignments: assignmentSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOfficeAssignmentById(
  assignmentId: string,
  userId: string,
  role: string
): Promise<OfficeAssignmentDetail | null> {
  await connectDB();

  const courseScope = await getUserCourseScope(userId, role);

  const query: Record<string, unknown> = { _id: toObjectId(assignmentId) };
  if (courseScope) {
    if (courseScope.length === 0) return null;
    query.course = { $in: courseScope };
  }

  const assignment = await Assignment.findOne(query)
    .populate([
      { path: "course", select: "name" },
      { path: "module", select: "title" },
      { path: "lesson", select: "title" },
    ])
    .lean();

  if (!assignment) return null;

  const stats = await Submission.aggregate<{
    _id: Types.ObjectId;
    total: number;
    pending: number;
    graded: number;
  }>([
    { $match: { assignment: assignment._id } },
    {
      $group: {
        _id: "$assignment",
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", SUBMISSION_STATUSES.SUBMITTED] }, 1, 0] } },
        graded: { $sum: { $cond: [{ $eq: ["$status", SUBMISSION_STATUSES.GRADED] }, 1, 0] } },
      },
    },
  ]);

  const stat = stats[0] ?? { total: 0, pending: 0, graded: 0 };
  const course = assignment.course as unknown as { _id: Types.ObjectId; name: string };
  const moduleDoc = assignment.module as unknown as { _id: Types.ObjectId; title: string } | null;
  const lesson = assignment.lesson as unknown as { _id: Types.ObjectId; title: string } | null;

  return {
    id: assignment._id.toString(),
    title: assignment.title,
    courseId: course._id.toString(),
    courseName: course.name,
    moduleId: moduleDoc?._id.toString() ?? null,
    moduleTitle: moduleDoc?.title ?? null,
    lessonId: lesson?._id.toString() ?? null,
    lessonTitle: lesson?.title ?? null,
    dueAt: assignment.dueAt?.toISOString() ?? null,
    maxScore: assignment.maxScore,
    isPublished: assignment.isPublished,
    totalSubmissions: stat.total,
    pendingReviews: stat.pending,
    gradedSubmissions: stat.graded,
    updatedAt: assignment.updatedAt.toISOString(),
    instructions: assignment.instructions,
    createdAt: assignment.createdAt.toISOString(),
    createdById: "",
    createdByName: "",
  };
}

export async function getOfficeSubmissions(
  assignmentId: string,
  filters: { search?: string; status?: string },
  sort: { field: string; direction: "asc" | "desc" },
  pagination: PaginationParams,
  userId: string,
  role: string
): Promise<{ submissions: OfficeSubmissionSummary[]; total: number; page: number; limit: number; totalPages: number }> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const courseScope = await getUserCourseScope(userId, role);

  const assignment = await Assignment.findById(toObjectId(assignmentId)).lean();
  if (!assignment) {
    return { submissions: [], total: 0, page, limit, totalPages: 0 };
  }

  if (courseScope && courseScope.length > 0) {
    const hasAccess = courseScope.some((c) => c.equals(assignment.course));
    if (!hasAccess) {
      return { submissions: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  const query: Record<string, unknown> = { assignment: assignment._id };

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    const students = await User.find({ role: "student", $or: [{ name: regex }, { email: regex }] })
      .select("_id")
      .lean();
    const studentIds = students.map((s) => s._id);
    query.student = { $in: studentIds };
  }

  if (filters.status === "pending_review") {
    query.status = SUBMISSION_STATUSES.SUBMITTED;
  } else if (filters.status === "graded") {
    query.status = SUBMISSION_STATUSES.GRADED;
  } else if (filters.status === "late") {
    if (assignment.dueAt) {
      query.submittedAt = { $gt: assignment.dueAt };
    }
  }

  const sortField = sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate({ path: "student", select: "name email" })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(query),
  ]);

  const submissionSummaries: OfficeSubmissionSummary[] = submissions.map((submission) => {
    const student = submission.student as unknown as { _id: Types.ObjectId; name: string; email: string };
    const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const submittedAt = new Date(submission.submittedAt);
    const isLate = dueAt && submittedAt > dueAt;

    return {
      id: submission._id.toString(),
      studentId: student._id.toString(),
      studentName: student.name,
      studentEmail: student.email,
      submissionNumber: 1,
      submittedAt: submission.submittedAt.toISOString(),
      status: submission.status,
      isLate: !!isLate,
      score: submission.score ?? null,
      maxScore: assignment.maxScore,
      feedback: submission.feedback ?? null,
      gradedAt: submission.gradedAt?.toISOString() ?? null,
      gradedById: undefined,
      gradedByName: undefined,
    };
  });

  return {
    submissions: submissionSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOfficeSubmissionDetail(
  assignmentId: string,
  submissionId: string,
  userId: string,
  role: string
): Promise<OfficeSubmissionDetail | null> {
  await connectDB();

  const courseScope = await getUserCourseScope(userId, role);

  const submission = await Submission.findOne({ _id: toObjectId(submissionId), assignment: toObjectId(assignmentId) })
    .populate([
      { path: "student", select: "name email" },
      { path: "assignment", select: "title course maxScore dueAt" },
    ])
    .lean();

  if (!submission) return null;

  const assignment = submission.assignment as unknown as {
    _id: Types.ObjectId;
    title: string;
    course: Types.ObjectId;
    maxScore: number;
    dueAt?: Date | null;
  };

  if (courseScope && courseScope.length > 0) {
    const hasAccess = courseScope.some((c) => c.equals(assignment.course));
    if (!hasAccess) return null;
  }

  const course = await Course.findById(assignment.course).select("name").lean();
  const student = submission.student as unknown as { _id: Types.ObjectId; name: string; email: string };
  const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const submittedAt = new Date(submission.submittedAt);
  const isLate = dueAt && submittedAt > dueAt;

  const previousSubmissions: PreviousSubmission[] = [];

  const auditLogs = await AuditLog.find({
    entityType: "submission",
    entityId: submission._id,
    action: { $in: ["submission.grade", "submission.regrade"] },
  })
    .sort({ createdAt: 1 })
    .lean();

  const gradingHistory: GradingHistoryEntry[] = auditLogs.map((log) => {
    const metadata = (log.metadata ?? {}) as {
      newScore?: number;
      score?: number;
      feedback?: string;
      internalNote?: string;
      previousScore?: number;
    };
    return {
      id: log._id.toString(),
      score: metadata.newScore ?? metadata.score ?? 0,
      feedback: metadata.feedback ?? "",
      internalNote: metadata.internalNote,
      gradedById: log.actorUserId.toString(),
      gradedByName: log.actorRole,
      gradedAt: log.createdAt.toISOString(),
      isRegrade: log.action === "submission.regrade",
      previousScore: metadata.previousScore,
    };
  });

  return {
    id: submission._id.toString(),
    studentId: student._id.toString(),
    studentName: student.name,
    studentEmail: student.email,
    submissionNumber: 1,
    submittedAt: submission.submittedAt.toISOString(),
    status: submission.status,
    isLate: !!isLate,
    score: submission.score ?? null,
    maxScore: assignment.maxScore,
    feedback: submission.feedback ?? null,
    gradedAt: submission.gradedAt?.toISOString() ?? null,
    gradedById: undefined,
    gradedByName: undefined,
    assignmentId: assignment._id.toString(),
    assignmentTitle: assignment.title,
    courseId: assignment.course.toString(),
    courseName: course?.name ?? "Unknown Course",
    content: submission.content ?? null,
    fileUrl: submission.fileUrl ?? null,
    originalFileName: submission.originalFileName ?? null,
    previousSubmissions,
    gradingHistory,
  };
}