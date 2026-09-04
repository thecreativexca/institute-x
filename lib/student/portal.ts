import "server-only";

import { Types } from "mongoose";

import { AUDIENCES, ENROLLMENT_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Announcement } from "@/models/Announcement";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Payment } from "@/models/Payment";
import { Session } from "@/models/Session";

async function accessibleCourseIds(studentId: string) {
  await connectDB();
  const now = new Date();
  const rows = await Enrollment.find({
    student: new Types.ObjectId(studentId),
    status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }],
  }).distinct("course");
  return rows as Types.ObjectId[];
}

export async function listStudentAnnouncements(studentId: string) {
  const courseIds = await accessibleCourseIds(studentId);
  const now = new Date();
  const rows = await Announcement.find({
    isActive: true,
    audience: { $in: [AUDIENCES.ALL, AUDIENCES.STUDENTS] },
    $and: [
      { $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] },
      { $or: [{ course: null }, { course: { $in: courseIds } }] },
    ],
  }).sort({ publishedAt: -1, createdAt: -1 }).lean();
  const courses = await Course.find({ _id: { $in: rows.flatMap((row) => row.course ? [row.course] : []) } }).select("name").lean();
  const names = new Map(courses.map((course) => [course._id.toString(), course.name]));
  return rows.map((row) => ({
    id: row._id.toString(), title: row.title, body: row.body,
    courseName: row.course ? names.get(row.course.toString()) ?? null : null,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  }));
}

export async function listStudentSessions(studentId: string) {
  const courseIds = await accessibleCourseIds(studentId);
  const rows = await Session.find({ course: { $in: courseIds }, isDisplayed: true })
    .sort({ date: 1, startTime: 1, sortOrder: 1 }).lean();
  const courses = await Course.find({ _id: { $in: courseIds } }).select("name slug").lean();
  const courseMap = new Map(courses.map((course) => [course._id.toString(), { id: course._id.toString(), name: course.name, slug: course.slug }]));
  return rows.map((row) => ({
    id: row._id.toString(), title: row.title, date: row.date.toISOString(),
    startTime: row.startTime ?? "", endTime: row.endTime ?? "", venue: row.venue,
    address: row.address ?? "", instructorName: row.instructorName ?? "", notes: row.notes ?? "",
    status: row.status, course: courseMap.get(row.course.toString()) ?? { id: "", name: "Course", slug: "" },
  }));
}

export async function listStudentPayments(studentId: string) {
  await connectDB();
  const rows = await Payment.find({ student: new Types.ObjectId(studentId) }).sort({ createdAt: -1 }).lean();
  const courses = await Course.find({ _id: { $in: rows.map((row) => row.course) } }).select("name slug").lean();
  const courseMap = new Map(courses.map((course) => [course._id.toString(), { name: course.name, slug: course.slug }]));
  return rows.map((row) => ({
    id: row._id.toString(), amount: row.amount, currency: row.currency, status: row.status,
    provider: row.provider, receiptNumber: row.receiptNumber, createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null, razorpayPaymentId: row.razorpayPaymentId ?? null,
    course: courseMap.get(row.course.toString()) ?? { name: "Course", slug: "" },
  }));
}

export async function getStudentPayment(studentId: string, paymentId: string) {
  if (!Types.ObjectId.isValid(paymentId)) return null;
  const payments = await listStudentPayments(studentId);
  return payments.find((payment) => payment.id === paymentId) ?? null;
}
