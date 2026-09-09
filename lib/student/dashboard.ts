import { connectDB } from "@/lib/db/connect";
import { Enrollment } from "@/models/Enrollment";
import { Progress } from "@/models/Progress";
import { Assignment } from "@/models/Assignment";
import { Quiz } from "@/models/Quiz";
import { Certificate } from "@/models/Certificate";
import { Announcement } from "@/models/Announcement";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import { Types } from "mongoose";
import { InternshipEnrollment } from "@/models/InternshipEnrollment";
import { listStudentProjects, serialize } from "@/lib/internships/service";

export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  overallProgress: number;
  certificates: number;
}

export interface EnrolledCourse {
  enrollment: {
    _id: string;
    status: string;
    enrolledAt: string;
    completedAt?: string | null;
  };
  course: {
    _id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    level: string;
    durationWeeks?: number;
    thumbnailUrl?: string;
  };
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  currentLesson?: {
    id: string;
    title: string;
    moduleTitle: string;
  };
  status: "not_started" | "in_progress" | "completed";
}

export interface RecentActivity {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  completedAt: string;
  status: "completed" | "in_progress";
}

export interface PendingTask {
  id: string;
  type: "assignment" | "quiz";
  courseId: string;
  courseTitle: string;
  title: string;
  dueAt: string | null;
  status: "pending" | "overdue";
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
  read: boolean;
}

export interface CertificatePreview {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  issuedAt: string;
  status: "issued" | "revoked";
}

export interface StudentProfilePreview {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  emailVerifiedAt: string | null;
}

export async function getCareerWidget(studentId: string) {
  await connectDB();
  const enrollment = await InternshipEnrollment.findOne({ student: toObjectId(studentId), status: { $in: ["selected", "active", "paused"] } }).populate("internship", "title").sort({ updatedAt: -1 }).lean();
  const projects = await listStudentProjects(studentId);
  return serialize({ enrollment, activeProjects: projects.filter((p: { submission?: { status?: string } | null }) => !p.submission || !["approved", "completed"].includes(p.submission.status ?? "")).length });
}

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

// Raw document types for lean() results
interface RawEnrollment {
  _id: Types.ObjectId;
  status: string;
  enrolledAt: Date;
  completedAt?: Date | null;
  course: RawCourse | null;
}

interface RawCourse {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription?: string;
  level: string;
  durationWeeks?: number;
  thumbnailUrl?: string;
}

interface RawProgress {
  _id: Types.ObjectId;
  status: string;
  completedAt?: Date | null;
  lastViewedAt?: Date | null;
  lesson: RawLesson | Types.ObjectId;
  course: Types.ObjectId;
  updatedAt: Date;
}

interface RawLesson {
  _id: Types.ObjectId;
  title: string;
  module: RawModule | Types.ObjectId;
}

interface RawModule {
  _id: Types.ObjectId;
  title: string;
}

interface RawAssignment {
  _id: Types.ObjectId;
  title: string;
  dueAt?: Date | null;
  course: Types.ObjectId | RawCourse;
}

interface RawQuiz {
  _id: Types.ObjectId;
  title: string;
  course: Types.ObjectId | RawCourse;
}

interface RawCertificate {
  _id: Types.ObjectId;
  certificateNumber: string;
  issuedAt: Date;
  status: "issued" | "revoked";
  course: Types.ObjectId | RawCourse;
}

interface RawAnnouncement {
  _id: Types.ObjectId;
  title: string;
  body: string;
  publishedAt?: Date | null;
}

async function getStudentEnrollments(studentId: string): Promise<RawEnrollment[]> {
  await connectDB();
  const studentObjectId = toObjectId(studentId);

  const enrollments = await Enrollment.find({ student: studentObjectId })
    .populate({
      path: "course",
      select: "name slug shortDescription level durationWeeks thumbnailUrl",
      match: { status: "published" },
    })
    .lean();

  return (enrollments as unknown as RawEnrollment[]).filter((e) => e.course != null);
}

async function getCourseProgress(studentId: string, courseId: string) {
  await connectDB();

  const courseObjectId = toObjectId(courseId);
  const studentObjectId = toObjectId(studentId);

  const [progressRecords, totalLessons, modules] = await Promise.all([
    Progress.find({ student: studentObjectId, course: courseObjectId })
      .populate("lesson", "title module")
      .lean(),
    Lesson.countDocuments({ course: courseObjectId }),
    Module.find({ course: courseObjectId }).select("title").lean(),
  ]);

  const completedLessons = (progressRecords as unknown as RawProgress[]).filter((p) => p.status === "completed").length;
  const inProgressLessons = (progressRecords as unknown as RawProgress[]).filter((p) => p.status === "in_progress").length;

  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find current/last lesson
  const lastViewed = (progressRecords as unknown as RawProgress[])
    .filter((p) => p.lastViewedAt)
    .sort((a, b) => new Date(b.lastViewedAt!).getTime() - new Date(a.lastViewedAt!).getTime())[0];

  let currentLesson: EnrolledCourse["currentLesson"] = undefined;
  if (lastViewed && lastViewed.lesson && typeof lastViewed.lesson === "object" && "_id" in lastViewed.lesson) {
    const lesson = lastViewed.lesson as RawLesson;
    const moduleDoc = (modules as unknown as RawModule[]).find((m) => m._id.toString() === (lesson.module as RawModule)._id.toString());
    currentLesson = {
      id: lesson._id.toString(),
      title: lesson.title,
      moduleTitle: moduleDoc?.title ?? "Unknown Module",
    };
  }

  let status: EnrolledCourse["status"] = "not_started";
  if (completedLessons === totalLessons && totalLessons > 0) {
    status = "completed";
  } else if (completedLessons > 0 || inProgressLessons > 0) {
    status = "in_progress";
  }

  return {
    progressPercent,
    completedLessons,
    totalLessons,
    currentLesson,
    status,
  };
}

export async function getDashboardStats(studentId: string): Promise<DashboardStats> {
  await connectDB();

  const studentObjectId = toObjectId(studentId);

  const [enrollments, completedEnrollments, certificates] = await Promise.all([
    Enrollment.countDocuments({ student: studentObjectId, status: { $in: ["active", "completed"] } }),
    Enrollment.countDocuments({ student: studentObjectId, status: "completed" }),
    Certificate.countDocuments({ student: studentObjectId, status: "issued" }),
  ]);

  // Calculate overall progress across all courses
  const allEnrollments = await Enrollment.find({ student: studentObjectId, status: { $in: ["active", "completed"] } })
    .select("course")
    .lean();

  let overallProgress = 0;
  if (allEnrollments.length > 0) {
    const courseIds = (allEnrollments as unknown as Array<{ course: Types.ObjectId }>).map((e) => e.course);
    const progressRecords = await Progress.find({ student: studentObjectId, course: { $in: courseIds } }).lean();

    const coursesWithProgress = new Map<string, { completed: number; total: number }>();

    for (const courseId of courseIds) {
      const courseLessons = await Lesson.countDocuments({ course: courseId });
      const courseProgress = (progressRecords as unknown as Array<{ course: Types.ObjectId; status: string }>).filter(
        (p) => p.course.toString() === courseId.toString() && p.status === "completed"
      ).length;

      if (courseLessons > 0) {
        coursesWithProgress.set(courseId.toString(), {
          completed: courseProgress,
          total: courseLessons,
        });
      }
    }

    if (coursesWithProgress.size > 0) {
      let totalCompleted = 0;
      let totalLessons = 0;
      for (const [, data] of coursesWithProgress) {
        totalCompleted += data.completed;
        totalLessons += data.total;
      }
      overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
    }
  }

  return {
    enrolledCourses: enrollments,
    completedCourses: completedEnrollments,
    overallProgress,
    certificates,
  };
}

export async function getEnrolledCourses(studentId: string): Promise<EnrolledCourse[]> {
  const enrollments = await getStudentEnrollments(studentId);

  const courses = await Promise.all(
    enrollments.map(async (enrollment: RawEnrollment) => {
      const progress = await getCourseProgress(studentId, enrollment.course!._id.toString());
      return {
        enrollment: {
          _id: enrollment._id.toString(),
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          completedAt: enrollment.completedAt?.toISOString() ?? null,
        },
        course: {
          _id: enrollment.course!._id.toString(),
          name: enrollment.course!.name,
          slug: enrollment.course!.slug,
          shortDescription: enrollment.course!.shortDescription,
          level: enrollment.course!.level,
          durationWeeks: enrollment.course!.durationWeeks,
          thumbnailUrl: enrollment.course!.thumbnailUrl,
        },
        ...progress,
      };
    })
  );

  // Sort: in_progress first, then not_started, then completed
  return courses.sort((a, b) => {
    const order = { in_progress: 0, not_started: 1, completed: 2 };
    return order[a.status] - order[b.status];
  });
}

export async function getRecentActivity(studentId: string, limit = 5): Promise<RecentActivity[]> {
  await connectDB();

  const studentObjectId = toObjectId(studentId);

  const progressRecords = await Progress.find({ student: studentObjectId, status: { $in: ["completed", "in_progress"] } })
    .populate({
      path: "lesson",
      select: "title module",
      populate: { path: "module", select: "title" },
    })
    .populate({ path: "course", select: "name" })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return (progressRecords as unknown as Array<{
    lesson: RawLesson;
    course: RawCourse;
    completedAt?: Date;
    updatedAt: Date;
    status: string;
  }>).map((p) => ({
    courseId: p.course._id.toString(),
    courseTitle: p.course.name,
    lessonId: p.lesson._id.toString(),
    lessonTitle: p.lesson.title,
    moduleTitle: (p.lesson.module as RawModule)?.title ?? "Unknown Module",
    completedAt: (p.completedAt ?? p.updatedAt).toISOString(),
    status: p.status === "completed" ? "completed" : "in_progress",
  }));
}

export async function getPendingTasks(studentId: string): Promise<PendingTask[]> {
  await connectDB();

  const studentObjectId = toObjectId(studentId);

  const enrollments = await Enrollment.find({ student: studentObjectId, status: "active" })
    .populate({ path: "course", select: "name" })
    .lean();

  const courseIds = (enrollments as unknown as Array<{ course: RawCourse }>).map((e) => e.course._id);

  const [assignments, quizzes] = await Promise.all([
    Assignment.find({ course: { $in: courseIds }, isPublished: true, dueAt: { $ne: null } })
      .populate({ path: "course", select: "name" })
      .lean(),
    Quiz.find({ course: { $in: courseIds }, isPublished: true })
      .populate({ path: "course", select: "name" })
      .lean(),
  ]);

  const now = new Date();
  const tasks: PendingTask[] = [];

  for (const assignment of assignments as unknown as RawAssignment[]) {
    const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const course = assignment.course as RawCourse;
    tasks.push({
      id: assignment._id.toString(),
      type: "assignment",
      courseId: course._id.toString(),
      courseTitle: course.name,
      title: assignment.title,
      dueAt: dueAt?.toISOString() ?? null,
      status: dueAt && dueAt < now ? "overdue" : "pending",
    });
  }

  for (const quiz of quizzes as unknown as RawQuiz[]) {
    const course = quiz.course as RawCourse;
    tasks.push({
      id: quiz._id.toString(),
      type: "quiz",
      courseId: course._id.toString(),
      courseTitle: course.name,
      title: quiz.title,
      dueAt: null,
      status: "pending",
    });
  }

  return tasks.sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    return 0;
  });
}

export async function getAnnouncements(_studentId: string, limit = 5): Promise<AnnouncementItem[]> {
  await connectDB();

  const announcements = await Announcement.find({
    audience: { $in: ["all", "students"] },
    isActive: true,
    publishedAt: { $lte: new Date() },
    $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  return (announcements as unknown as RawAnnouncement[]).map((a) => ({
    id: a._id.toString(),
    title: a.title,
    body: a.body,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    read: false,
  }));
}

export async function getCertificates(studentId: string): Promise<CertificatePreview[]> {
  await connectDB();

  const studentObjectId = toObjectId(studentId);

  const certificates = await Certificate.find({ student: studentObjectId, status: "issued" })
    .populate({ path: "course", select: "name" })
    .sort({ issuedAt: -1 })
    .lean();

  return (certificates as unknown as RawCertificate[]).map((c) => ({
    id: c._id.toString(),
    certificateNumber: c.certificateNumber,
    courseTitle: (c.course as RawCourse).name,
    issuedAt: c.issuedAt.toISOString(),
    status: c.status,
  }));
}

export async function getStudentProfile(studentId: string): Promise<StudentProfilePreview | null> {
  await connectDB();

  const { User } = await import("@/models/User");
  const user = await User.findById(toObjectId(studentId))
    .select("name email phone avatarUrl emailVerifiedAt")
    .lean();

  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}
