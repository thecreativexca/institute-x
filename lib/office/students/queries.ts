import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Progress } from "@/models/Progress";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Payment } from "@/models/Payment";
import { Certificate } from "@/models/Certificate";
import { Types } from "mongoose";
import {
  OfficeStudentSummary,
  OfficeStudentDetail,
  StudentEnrollment,
  StudentProgressCourse,
  StudentAssignment,
  StudentQuizAttempt,
  StudentPayment,
  StudentCertificate,
  StudentActivityEvent,
  StudentFilters,
  StudentSortOptions,
  PaginationParams,
  StudentListResult,
} from "./dto";
import { ENROLLMENT_STATUSES, type EnrollmentStatus, type AccountStatus, type PaymentStatus, type CertificateStatus } from "@/lib/constants";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getStudents(
  filters: StudentFilters,
  sort: StudentSortOptions,
  pagination: PaginationParams
): Promise<StudentListResult> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {
    role: "student",
  };

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  if (filters.status && filters.status !== "ALL") {
    query.status = filters.status;
  }

  if (filters.emailVerified && filters.emailVerified !== "ALL") {
    if (filters.emailVerified === "verified") {
      query.emailVerifiedAt = { $ne: null };
    } else {
      query.emailVerifiedAt = null;
    }
  }

  if (filters.joinedFrom || filters.joinedTo) {
    query.createdAt = {};
    if (filters.joinedFrom) {
      (query.createdAt as Record<string, Date>).$gte = new Date(filters.joinedFrom);
    }
    if (filters.joinedTo) {
      const toDate = new Date(filters.joinedTo);
      toDate.setHours(23, 59, 59, 999);
      (query.createdAt as Record<string, Date>).$lte = toDate;
    }
  }

  // Enrollment-based filters (course / has enrollment) are resolved through the
  // Enrollment collection so we never duplicate membership data on User.
  if (filters.courseId || filters.hasEnrollment !== undefined) {
    const enrollmentQuery: Record<string, unknown> = {};
    if (filters.courseId && Types.ObjectId.isValid(filters.courseId)) {
      enrollmentQuery.course = toObjectId(filters.courseId);
    }
    if (filters.hasEnrollment === false) {
      const enrolledIds = await Enrollment.distinct("student", enrollmentQuery);
      query._id = { $nin: enrolledIds };
    } else {
      const enrolledIds = await Enrollment.distinct("student", enrollmentQuery);
      query._id = { $in: enrolledIds };
    }
  }

  // "Most enrollments" is not a User field; fall back to newest-first.
  const sortField = sort.field === "enrollmentCount" ? "createdAt" : sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [students, total] = await Promise.all([
    User.find(query)
      .select("name email phone status emailVerifiedAt createdAt lastLoginAt")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  if (students.length === 0) {
    return {
      students: [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const studentIds = students.map((s) => s._id);

  const enrollments = await Enrollment.find({ student: { $in: studentIds } })
    .select("student course status")
    .lean();

  const enrollmentCounts = new Map<string, { total: number; active: number; completed: number }>();
  for (const enrollment of enrollments) {
    const studentId = enrollment.student.toString();
    const current = enrollmentCounts.get(studentId) ?? { total: 0, active: 0, completed: 0 };
    current.total += 1;
    if (enrollment.status === ENROLLMENT_STATUSES.ACTIVE) current.active += 1;
    if (enrollment.status === ENROLLMENT_STATUSES.COMPLETED) current.completed += 1;
    enrollmentCounts.set(studentId, current);
  }

  const studentSummaries: OfficeStudentSummary[] = students.map((student) => {
    const counts = enrollmentCounts.get(student._id.toString()) ?? { total: 0, active: 0, completed: 0 };
    return {
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status as AccountStatus,
      emailVerifiedAt: student.emailVerifiedAt?.toISOString() ?? null,
      createdAt: student.createdAt.toISOString(),
      enrollmentCounts: counts,
    };
  });

  return {
    students: studentSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getStudentById(studentId: string): Promise<OfficeStudentDetail | null> {
  await connectDB();

  const student = await User.findOne({ _id: toObjectId(studentId), role: "student" })
    .select("name email phone status avatarUrl emailVerifiedAt createdAt lastLoginAt lastOfficeLoginAt")
    .lean();

  if (!student) return null;

  const enrollments = await Enrollment.countDocuments({ student: student._id });
  const activeEnrollments = await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.ACTIVE });
  const completedEnrollments = await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.COMPLETED });

  return {
    id: student._id.toString(),
    name: student.name,
    email: student.email,
    phone: student.phone,
    status: student.status as AccountStatus,
    emailVerifiedAt: student.emailVerifiedAt?.toISOString() ?? null,
    createdAt: student.createdAt.toISOString(),
    lastLoginAt: student.lastLoginAt?.toISOString() ?? null,
    lastOfficeLoginAt: student.lastOfficeLoginAt?.toISOString() ?? null,
    avatarUrl: student.avatarUrl ?? null,
    enrollmentCounts: {
      total: enrollments,
      active: activeEnrollments,
      completed: completedEnrollments,
    },
  };
}

export async function getStudentEnrollments(studentId: string): Promise<StudentEnrollment[]> {
  await connectDB();

  const enrollments = await Enrollment.find({ student: toObjectId(studentId) })
    .populate({
      path: "course",
      select: "name slug",
    })
    .lean();

  const courseIds = enrollments.map((e) => e.course);
  const courses = await Course.find({ _id: { $in: courseIds } }).select("name slug").lean();
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

  const results: StudentEnrollment[] = [];

  for (const enrollment of enrollments) {
    const course = courseMap.get(enrollment.course.toString());
    if (!course) continue;

    const progress = await Progress.find({ student: toObjectId(studentId), course: enrollment.course })
      .select("status")
      .lean();

    const completedLessons = progress.filter((p) => p.status === "completed").length;
    const totalLessons = await Lesson.countDocuments({ course: enrollment.course, isPublished: true });
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    results.push({
      id: enrollment._id.toString(),
      courseId: enrollment.course.toString(),
      courseName: course.name,
      courseSlug: course.slug,
      status: enrollment.status as EnrollmentStatus,
      paymentStatus: enrollment.paymentStatus as PaymentStatus,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      completedAt: enrollment.completedAt?.toISOString() ?? null,
      progressPercent,
      completedLessons,
      totalLessons,
    });
  }

  return results;
}

export async function getStudentProgress(studentId: string): Promise<StudentProgressCourse[]> {
  await connectDB();

  const enrollments = await Enrollment.find({ student: toObjectId(studentId), status: { $in: ["active", "completed"] } })
    .select("course")
    .lean();

  const courseIds = enrollments.map((e) => e.course);
  const courses = await Course.find({ _id: { $in: courseIds } }).select("name").lean();
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c.name]));

  const results: StudentProgressCourse[] = [];

  for (const courseId of courseIds) {
    const progressRecords = await Progress.find({ student: toObjectId(studentId), course: courseId })
      .populate("lesson", "title module")
      .lean();

    const modules = await Module.find({ course: courseId }).select("title").lean();
    const moduleMap = new Map(modules.map((m) => [m._id.toString(), m.title]));

    const lessons = await Lesson.find({ course: courseId, isPublished: true }).select("module").lean();
    const lessonModuleMap = new Map(lessons.map((l) => [l._id.toString(), l.module.toString()]));

    const moduleProgressMap = new Map<string, { completed: number; total: number }>();

    for (const lesson of lessons) {
      const moduleId = lesson.module.toString();
      const current = moduleProgressMap.get(moduleId) ?? { completed: 0, total: 0 };
      current.total += 1;
      const progress = progressRecords.find((p) => p.lesson && typeof p.lesson === "object" && p.lesson._id.toString() === lesson._id.toString());
      if (progress?.status === "completed") current.completed += 1;
      moduleProgressMap.set(moduleId, current);
    }

    const moduleProgress = Array.from(moduleProgressMap.entries()).map(([moduleId, data]) => ({
      moduleId,
      moduleTitle: moduleMap.get(moduleId) ?? "Unknown Module",
      completedLessons: data.completed,
      totalLessons: data.total,
      percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      status: data.completed === data.total && data.total > 0 ? "completed" : data.completed > 0 ? "in_progress" : "not_started",
    })) as StudentProgressCourse["moduleProgress"];

    const completedLessons = progressRecords.filter((p) => p.status === "completed").length;
    const totalLessons = lessons.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const lastViewed = progressRecords
      .filter((p) => p.lastViewedAt)
      .sort((a, b) => new Date(b.lastViewedAt!).getTime() - new Date(a.lastViewedAt!).getTime())[0];

    results.push({
      courseId: courseId.toString(),
      courseName: courseMap.get(courseId.toString()) ?? "Unknown Course",
      progressPercent,
      completedLessons,
      totalLessons,
      moduleProgress,
      lastActivityAt: lastViewed?.lastViewedAt?.toISOString() ?? lastViewed?.updatedAt?.toISOString() ?? null,
    });
  }

  return results;
}

export async function getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
  await connectDB();

  const submissions = await Submission.find({ student: toObjectId(studentId) })
    .populate({
      path: "assignment",
      select: "title maxScore dueAt course",
      populate: { path: "course", select: "name" },
    })
    .sort({ submittedAt: -1 })
    .lean();

  const results: StudentAssignment[] = [];

  for (const submission of submissions) {
    const assignment = submission.assignment as unknown as { _id: Types.ObjectId; title: string; maxScore: number; dueAt?: Date | null; course: { _id: Types.ObjectId; name: string } };
    const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const submittedAt = new Date(submission.submittedAt);
    const isLate = dueAt && submittedAt > dueAt;

    results.push({
      id: submission._id.toString(),
      assignmentId: assignment._id.toString(),
      assignmentTitle: assignment.title,
      courseId: assignment.course._id.toString(),
      courseName: assignment.course.name,
      submissionNumber: 1,
      submittedAt: submission.submittedAt.toISOString(),
      status: submission.status,
      score: submission.score ?? null,
      maxScore: assignment.maxScore,
      feedback: submission.feedback ?? null,
      isLate: !!isLate,
    });
  }

  return results;
}

export async function getStudentQuizAttempts(studentId: string): Promise<StudentQuizAttempt[]> {
  await connectDB();

  const attempts = await QuizAttempt.find({ student: toObjectId(studentId) })
    .populate({
      path: "quiz",
      select: "title course",
      populate: { path: "course", select: "name" },
    })
    .sort({ createdAt: -1 })
    .lean();

  return attempts.map((attempt) => {
    const quiz = attempt.quiz as unknown as { _id: Types.ObjectId; title: string; course: { _id: Types.ObjectId; name: string } };
    return {
      id: attempt._id.toString(),
      quizId: quiz._id.toString(),
      quizTitle: quiz.title,
      courseId: quiz.course._id.toString(),
      courseName: quiz.course.name,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      status: attempt.status,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
    };
  });
}

export async function getStudentPayments(studentId: string): Promise<StudentPayment[]> {
  await connectDB();

  const payments = await Payment.find({ student: toObjectId(studentId) })
    .populate({ path: "course", select: "name" })
    .sort({ createdAt: -1 })
    .lean();

  return payments.map((payment) => ({
    id: payment._id.toString(),
    courseId: payment.course._id.toString(),
    courseName: (payment.course as unknown as { name: string }).name,
    amount: payment.amount,
    currency: payment.currency,
    provider: payment.provider,
    receiptNumber: payment.receiptNumber,
    status: payment.status as PaymentStatus,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  }));
}

export async function getStudentCertificates(studentId: string): Promise<StudentCertificate[]> {
  await connectDB();

  // No `course` populate: admin-issued certificates may have no course, and the
  // label always comes from the snapshot written at issuance. Filtering on a
  // populated course would silently hide exactly those certificates.
  const certificates = await Certificate.find({ student: toObjectId(studentId) })
    .sort({ issuedAt: -1 })
    .lean();

  return certificates.map((cert) => ({
    id: cert._id.toString(),
    certificateNumber: cert.certificateNumber,
    courseId: cert.course?.toString() ?? "",
    courseName: cert.certificateTitle ?? cert.courseNameSnapshot,
    issuedAt: cert.issuedAt.toISOString(),
    completionDate: cert.completionDate?.toISOString() ?? null,
    status: cert.status as CertificateStatus,
    verificationCode: cert.verificationCode,
    pdfUrl: cert.pdfUrl,
    issuedBy: cert.issuedBy,
  }));
}

export async function getStudentActivity(studentId: string, limit = 20): Promise<StudentActivityEvent[]> {
  await connectDB();

  const activities: StudentActivityEvent[] = [];

  const student = await User.findById(toObjectId(studentId)).select("createdAt status").lean();
  if (student) {
    activities.push({
      id: `account_created_${student._id}`,
      type: "account_created",
      description: "Account created",
      timestamp: student.createdAt.toISOString(),
    });
  }

  const enrollments = await Enrollment.find({ student: toObjectId(studentId) })
    .populate({ path: "course", select: "name" })
    .sort({ createdAt: -1 })
    .lean();

  for (const enrollment of enrollments) {
    const course = enrollment.course as unknown as { name: string; _id: Types.ObjectId } | null;
    if (course) {
      activities.push({
        id: `enrollment_${enrollment._id}`,
        type: "enrollment_created",
        description: `Enrolled in ${course.name}`,
        timestamp: enrollment.createdAt.toISOString(),
        courseId: course._id.toString(),
        courseName: course.name,
      });
    }
  }

  const progressCompleted = await Progress.find({ student: toObjectId(studentId), status: "completed" })
    .populate({ path: "lesson", select: "title module", populate: { path: "module", select: "title" } })
    .populate({ path: "course", select: "name" })
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();

  for (const progress of progressCompleted) {
    const lesson = progress.lesson as unknown as { title: string; module: { title: string } } | null;
    const course = progress.course as unknown as { name: string; _id: Types.ObjectId } | null;
    if (lesson && course) {
      activities.push({
        id: `lesson_${progress._id}`,
        type: "lesson_completed",
        description: `Completed lesson: ${lesson.title} (${lesson.module.title})`,
        timestamp: (progress.completedAt ?? progress.updatedAt).toISOString(),
        courseId: course._id.toString(),
        courseName: course.name,
      });
    }
  }

  const submissions = await Submission.find({ student: toObjectId(studentId) })
    .populate({ path: "assignment", select: "title course", populate: { path: "course", select: "name" } })
    .sort({ submittedAt: -1 })
    .limit(10)
    .lean();

  for (const submission of submissions) {
    const assignment = submission.assignment as unknown as { title: string; course: { name: string; _id: Types.ObjectId } } | null;
    if (assignment) {
      activities.push({
        id: `assignment_${submission._id}`,
        type: "assignment_submitted",
        description: `Submitted assignment: ${assignment.title}`,
        timestamp: submission.submittedAt.toISOString(),
        courseId: assignment.course._id.toString(),
        courseName: assignment.course.name,
      });
    }
  }

  const quizAttempts = await QuizAttempt.find({ student: toObjectId(studentId), status: "submitted" })
    .populate({ path: "quiz", select: "title course", populate: { path: "course", select: "name" } })
    .sort({ submittedAt: -1 })
    .limit(10)
    .lean();

  for (const attempt of quizAttempts) {
    const quiz = attempt.quiz as unknown as { title: string; course: { name: string; _id: Types.ObjectId } } | null;
    if (quiz) {
      activities.push({
        id: `quiz_${attempt._id}`,
        type: "quiz_completed",
        description: `Completed quiz: ${quiz.title} (${attempt.percentage}%)`,
        timestamp: (attempt.submittedAt ?? attempt.updatedAt).toISOString(),
        courseId: quiz.course._id.toString(),
        courseName: quiz.course.name,
      });
    }
  }

  const payments = await Payment.find({ student: toObjectId(studentId), status: "paid" })
    .populate({ path: "course", select: "name" })
    .sort({ paidAt: -1 })
    .limit(5)
    .lean();

  for (const payment of payments) {
    const course = payment.course as unknown as { name: string; _id: Types.ObjectId } | null;
    if (course) {
      activities.push({
        id: `payment_${payment._id}`,
        type: "payment_completed",
        description: `Payment of ₹${payment.amount} for ${course.name}`,
        timestamp: (payment.paidAt ?? payment.createdAt).toISOString(),
        courseId: course._id.toString(),
        courseName: course.name,
      });
    }
  }

  const completedEnrollments = await Enrollment.find({ student: toObjectId(studentId), status: "completed" })
    .populate({ path: "course", select: "name" })
    .sort({ completedAt: -1 })
    .lean();

  for (const enrollment of completedEnrollments) {
    const course = enrollment.course as unknown as { name: string; _id: Types.ObjectId } | null;
    if (course) {
      activities.push({
        id: `course_completed_${enrollment._id}`,
        type: "course_completed",
        description: `Completed course: ${course.name}`,
        timestamp: (enrollment.completedAt ?? enrollment.updatedAt).toISOString(),
        courseId: course._id.toString(),
        courseName: course.name,
      });
    }
  }

  const certificates = await Certificate.find({ student: toObjectId(studentId), status: "issued" })
    .populate({ path: "course", select: "name" })
    .sort({ issuedAt: -1 })
    .lean();

  for (const cert of certificates) {
    const course = cert.course as unknown as { name: string; _id: Types.ObjectId } | null;
    if (course) {
      activities.push({
        id: `certificate_${cert._id}`,
        type: "certificate_issued",
        description: `Certificate issued: ${cert.certificateNumber} for ${course.name}`,
        timestamp: cert.issuedAt.toISOString(),
        courseId: course._id.toString(),
        courseName: course.name,
      });
    }
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activities.slice(0, limit);
}

export async function getStudentMetrics(): Promise<{
  total: number;
  active: number;
  suspended: number;
  newThisMonth: number;
}> {
  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, active, suspended, newThisMonth] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "student", status: "active" }),
    User.countDocuments({ role: "student", status: "suspended" }),
    User.countDocuments({ role: "student", createdAt: { $gte: startOfMonth } }),
  ]);

  return { total, active, suspended, newThisMonth };
}

export async function searchStudents(query: string, limit = 10): Promise<OfficeStudentSummary[]> {
  await connectDB();

  const escaped = escapeRegex(query.trim());
  const regex = new RegExp(escaped, "i");

  const students = await User.find({
    role: "student",
    $or: [{ name: regex }, { email: regex }, { phone: regex }],
  })
    .select("name email phone status emailVerifiedAt createdAt")
    .limit(limit)
    .lean();

  const studentIds = students.map((s) => s._id);
  const enrollmentCounts = await Enrollment.aggregate([
    { $match: { student: { $in: studentIds } } },
    { $group: { _id: "$student", total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
  ]);

  const countMap = new Map(enrollmentCounts.map((e) => [e._id.toString(), e]));

  return students.map((student) => {
    const counts = countMap.get(student._id.toString()) ?? { total: 0, active: 0, completed: 0 };
    return {
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status as AccountStatus,
      emailVerifiedAt: student.emailVerifiedAt?.toISOString() ?? null,
      createdAt: student.createdAt.toISOString(),
      enrollmentCounts: counts,
    };
  });
}
