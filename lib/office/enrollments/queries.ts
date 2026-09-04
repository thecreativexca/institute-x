import "server-only";

import { Types } from "mongoose";

import { ENROLLMENT_STATUSES, type EnrollmentStatus } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { User } from "@/models/User";
import type { EnrollmentCourseOption, EnrollmentListResult } from "./dto";

export async function listEnrollments(params: {
  search?: string;
  status?: string;
  source?: string;
  page: number;
  pageSize: number;
}): Promise<EnrollmentListResult> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.source && params.source !== "all") query.source = params.source;

  const search = params.search?.trim();
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const [students, courses] = await Promise.all([
      User.find({ role: "student", $or: [{ name: regex }, { email: regex }] }).select("_id").limit(250).lean(),
      Course.find({ name: regex }).select("_id").limit(250).lean(),
    ]);
    query.$or = [
      { student: { $in: students.map((item) => item._id) } },
      { course: { $in: courses.map((item) => item._id) } },
    ];
  }

  const [docs, total, all, active, completed, expiredOrCancelled] = await Promise.all([
    Enrollment.find(query)
      .sort({ enrolledAt: -1 })
      .skip((params.page - 1) * params.pageSize)
      .limit(params.pageSize)
      .lean(),
    Enrollment.countDocuments(query),
    Enrollment.countDocuments({}),
    Enrollment.countDocuments({ status: ENROLLMENT_STATUSES.ACTIVE }),
    Enrollment.countDocuments({ status: ENROLLMENT_STATUSES.COMPLETED }),
    Enrollment.countDocuments({ status: { $in: [ENROLLMENT_STATUSES.EXPIRED, ENROLLMENT_STATUSES.CANCELLED] } }),
  ]);

  const studentIds = uniqueIds(docs.map((item) => item.student));
  const courseIds = uniqueIds(docs.map((item) => item.course));
  const [students, courses] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).select("name email").lean(),
    Course.find({ _id: { $in: courseIds } }).select("name").lean(),
  ]);
  const studentMap = new Map(students.map((item) => [item._id.toString(), item]));
  const courseMap = new Map(courses.map((item) => [item._id.toString(), item]));

  return {
    enrollments: docs.map((item) => {
      const student = studentMap.get(item.student.toString());
      const course = courseMap.get(item.course.toString());
      return {
        id: item._id.toString(),
        studentId: item.student.toString(),
        studentName: student?.name ?? "Unknown student",
        studentEmail: student?.email ?? "",
        courseId: item.course.toString(),
        courseName: course?.name ?? "Unavailable course",
        status: item.status as EnrollmentStatus,
        source: item.source ?? "admin_manual",
        accessType: item.accessType ?? (item.expiresAt ? "time_limited" : "lifetime"),
        enrolledAt: item.enrolledAt.toISOString(),
        expiresAt: item.expiresAt?.toISOString() ?? null,
        completedAt: item.completedAt?.toISOString() ?? null,
      };
    }),
    total,
    page: params.page,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    summary: { total: all, active, completed, expiredOrCancelled },
  };
}

export async function getEnrollmentCourseOptions(): Promise<EnrollmentCourseOption[]> {
  await connectDB();
  const courses = await Course.find({ status: "published" }).select("name").sort({ name: 1 }).lean();
  return courses.map((course) => ({ id: course._id.toString(), name: course.name }));
}

function uniqueIds(values: Types.ObjectId[]) {
  return [...new Set(values.map(String))].map((value) => new Types.ObjectId(value));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
