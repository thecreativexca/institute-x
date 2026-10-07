import "server-only";

import { Types } from "mongoose";

import {
  ENROLLMENT_ACCESS_TYPES,
  ENROLLMENT_SOURCES,
  ENROLLMENT_STATUSES,
  FEE_STATUSES,
} from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Course, Enrollment, Payment, User } from "@/lib/mongodb/models";
import { calculateEnrollmentBalance } from "./calculate";
import { rupeesToPaise } from "./format";
import { notifyUser } from "@/lib/notifications/service";

export async function enrollInFreeCourse(
  studentId: string,
  courseId: string,
): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
  if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(courseId)) {
    return { success: false, error: "Invalid student or course." };
  }
  await connectDB();
  const [student, course] = await Promise.all([
    User.findById(studentId).select("name role status").lean(),
    Course.findById(courseId).lean(),
  ]);
  if (!student || student.role !== "student" || student.status !== "active") {
    return { success: false, error: "Student not found." };
  }
  if (!course || course.status !== "published") {
    return { success: false, error: "Course not found." };
  }
  if (!course.isFree && (course.price ?? 0) > 0) {
    return { success: false, error: "Please contact the institute office to complete admission." };
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { student: student._id, course: course._id },
    {
      $set: {
        status: ENROLLMENT_STATUSES.ACTIVE,
        paymentStatus: FEE_STATUSES.PAID,
        source: ENROLLMENT_SOURCES.FREE_COURSE,
        accessType: ENROLLMENT_ACCESS_TYPES.LIFETIME,
        enrolledAt: new Date(),
        completedAt: null,
        expiresAt: null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  try {
    await notifyUser({
      recipientId: student._id,
      title: "Enrollment activated",
      message: `You are now enrolled in ${course.name}.`,
      type: "success",
      link: `/student/courses/${course._id.toString()}`,
    });
  } catch (error) {
    console.error("Free enrollment notification failed:", error);
  }
  return { success: true, enrollmentId: enrollment._id.toString() };
}

export async function getStudentPayments(studentId: string) {
  await connectDB();
  const studentObjectId = new Types.ObjectId(studentId);
  const [payments, enrollments] = await Promise.all([
    Payment.find({ student: studentObjectId }).sort({ paymentDate: -1, createdAt: -1 }).lean(),
    Enrollment.find({ student: studentObjectId }).lean(),
  ]);
  const courseIds = [...new Set([
    ...payments.map((payment) => payment.course.toString()),
    ...enrollments.map((enrollment) => enrollment.course.toString()),
  ])];
  const courses = await Course.find({ _id: { $in: courseIds } })
    .select("name slug thumbnailUrl price currency")
    .lean();
  const courseMap = new Map(courses.map((course) => [course._id.toString(), course]));
  const enrollmentMap = new Map(enrollments.map((enrollment) => [enrollment._id.toString(), enrollment]));

  const balances = await Promise.all(enrollments.map(async (enrollment) => {
    const course = courseMap.get(enrollment.course.toString());
    const totalFee = rupeesToPaise(course?.price ?? 0);
    return [enrollment._id.toString(), await calculateEnrollmentBalance(enrollment._id, totalFee)] as const;
  }));

  return {
    payments: payments.map((payment) => ({
      ...payment,
      course: courseMap.get(payment.course.toString()) ?? null,
      enrollment: payment.enrollment ? enrollmentMap.get(payment.enrollment.toString()) ?? null : null,
    })),
    fees: enrollments.map((enrollment) => ({
      enrollment,
      course: courseMap.get(enrollment.course.toString()) ?? null,
      balance: new Map(balances).get(enrollment._id.toString())!,
    })),
  };
}

export async function getPaymentForStudent(paymentId: string, studentId: string) {
  if (!Types.ObjectId.isValid(paymentId) || !Types.ObjectId.isValid(studentId)) return null;
  await connectDB();
  const payment = await Payment.findOne({ _id: paymentId, student: studentId }).lean();
  if (!payment) return null;
  if (!payment.enrollment) return null;
  const [course, enrollment, recordedBy, verifiedBy] = await Promise.all([
    Course.findById(payment.course).select("name slug thumbnailUrl price currency").lean(),
    Enrollment.findById(payment.enrollment).select("status paymentStatus").lean(),
    User.findById(payment.recordedBy).select("name").lean(),
    payment.verifiedBy ? User.findById(payment.verifiedBy).select("name").lean() : null,
  ]);
  const balance = await calculateEnrollmentBalance(
    payment.enrollment,
    rupeesToPaise(course?.price ?? 0),
  );
  return { ...payment, course, enrollment, recordedBy, verifiedBy, balance };
}
