"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { recordAuditEvent } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/helpers";
import {
  ENROLLMENT_ACCESS_TYPES,
  ENROLLMENT_SOURCES,
  ENROLLMENT_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { User } from "@/models/User";
import type { EnrollmentActionResult } from "./dto";
import { notifyUser, safeNotify } from "@/lib/notifications/service";

const createSchema = z.object({
  studentEmail: z.string().trim().toLowerCase().email("Enter a valid student email."),
  courseId: z.string().refine(Types.ObjectId.isValid, "Select a valid course."),
  expiresAt: z.string().optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});

const statusSchema = z.object({
  status: z.enum(["active", "completed", "cancelled", "expired"]),
  expiresAt: z.string().optional().default(""),
});

export async function createManualEnrollmentAction(input: {
  studentEmail: string;
  courseId: string;
  expiresAt?: string;
  notes?: string;
}): Promise<EnrollmentActionResult> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { ok: false, error: "Please sign in again." };
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const expiry = parseExpiry(parsed.data.expiresAt);
    if (parsed.data.expiresAt && !expiry) return { ok: false, fieldErrors: { expiresAt: "Enter a valid expiry date." } };

    await connectDB();
    const [student, course] = await Promise.all([
      User.findOne({ email: parsed.data.studentEmail, role: "student" }),
      Course.findById(parsed.data.courseId),
    ]);
    if (!student) return { ok: false, fieldErrors: { studentEmail: "No student account uses this email." } };
    if (student.status !== "active") return { ok: false, error: "This student account is not active." };
    if (!course || course.status !== "published") return { ok: false, fieldErrors: { courseId: "Select a published course." } };

    let enrollment = await Enrollment.findOne({ student: student._id, course: course._id });
    if (enrollment && ["active", "completed"].includes(enrollment.status)) {
      return { ok: false, error: "This student already has an active enrollment for the course." };
    }
    if (enrollment) {
      enrollment.status = ENROLLMENT_STATUSES.ACTIVE;
      enrollment.paymentStatus = PAYMENT_STATUSES.PAID;
      enrollment.source = ENROLLMENT_SOURCES.ADMIN_MANUAL;
      enrollment.accessType = expiry ? ENROLLMENT_ACCESS_TYPES.TIME_LIMITED : ENROLLMENT_ACCESS_TYPES.LIFETIME;
      enrollment.expiresAt = expiry;
      enrollment.enrolledAt = new Date();
      enrollment.completedAt = null;
      enrollment.notes = parsed.data.notes || undefined;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        student: student._id,
        course: course._id,
        status: ENROLLMENT_STATUSES.ACTIVE,
        paymentStatus: PAYMENT_STATUSES.PAID,
        source: ENROLLMENT_SOURCES.ADMIN_MANUAL,
        accessType: expiry ? ENROLLMENT_ACCESS_TYPES.TIME_LIMITED : ENROLLMENT_ACCESS_TYPES.LIFETIME,
        expiresAt: expiry,
        enrolledAt: new Date(),
        notes: parsed.data.notes || undefined,
      });
    }
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "enrollment.manage",
      entityType: "enrollment",
      entityId: enrollment._id.toString(),
      metadata: { action: "manual_enroll", studentId: student._id.toString(), courseId: course._id.toString() },
    });
    try {
      await notifyUser({ recipientId: student._id, title: "Course enrollment", message: `You have been enrolled in ${course.name} by the institute.`, type: "success", link: `/student/courses/${course._id.toString()}` });
    } catch (notificationError) {
      console.error("Manual enrollment notification failed:", notificationError);
    }
    revalidateEnrollmentPaths(student._id.toString(), course._id.toString());
    return { ok: true, message: "Student enrolled successfully." };
  } catch (error) {
    console.error("Manual enrollment failed:", error);
    return { ok: false, error: "Unable to create the enrollment." };
  }
}

export async function updateEnrollmentAction(
  enrollmentId: string,
  input: { status: string; expiresAt?: string }
): Promise<EnrollmentActionResult> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { ok: false, error: "Please sign in again." };
    if (!Types.ObjectId.isValid(enrollmentId)) return { ok: false, error: "Invalid enrollment." };
    const parsed = statusSchema.safeParse(input);
    if (!parsed.success) return validationError(parsed.error);
    const expiry = parseExpiry(parsed.data.expiresAt);
    if (parsed.data.expiresAt && !expiry) return { ok: false, error: "Enter a valid expiry date." };
    await connectDB();
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) return { ok: false, error: "Enrollment not found." };
    enrollment.status = parsed.data.status;
    enrollment.expiresAt = expiry;
    enrollment.accessType = expiry ? ENROLLMENT_ACCESS_TYPES.TIME_LIMITED : ENROLLMENT_ACCESS_TYPES.LIFETIME;
    if (parsed.data.status === ENROLLMENT_STATUSES.COMPLETED && !enrollment.completedAt) enrollment.completedAt = new Date();
    if (parsed.data.status !== ENROLLMENT_STATUSES.COMPLETED) enrollment.completedAt = null;
    await enrollment.save();
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "enrollment.manage",
      entityType: "enrollment",
      entityId: enrollmentId,
      metadata: { action: "status_update", status: enrollment.status, expiresAt: expiry?.toISOString() ?? null },
    });
    const course = await Course.findById(enrollment.course).select("name").lean();
    const statusMessages: Record<string, { title: string; message: string; type: "success" | "warning" | "info" }> = {
      active: {
        title: "Course access restored",
        message: `Your access to ${course?.name ?? "your course"} is active again.`,
        type: "success",
      },
      completed: {
        title: "Course completed",
        message: `You completed ${course?.name ?? "your course"}.`,
        type: "success",
      },
      cancelled: {
        title: "Enrollment cancelled",
        message: `Your enrollment in ${course?.name ?? "your course"} was cancelled.`,
        type: "warning",
      },
      expired: {
        title: "Enrollment expired",
        message: `Your access to ${course?.name ?? "your course"} has expired.`,
        type: "warning",
      },
    };
    const statusNotice = statusMessages[enrollment.status];
    if (statusNotice) {
      await safeNotify(
        () =>
          notifyUser({
            recipientId: enrollment.student,
            title: statusNotice.title,
            message: statusNotice.message,
            type: statusNotice.type,
            link: `/student/courses/${enrollment.course.toString()}`,
          }),
        "Enrollment status update",
      );
    }
    revalidateEnrollmentPaths(enrollment.student.toString(), enrollment.course.toString());
    return { ok: true, message: "Enrollment updated." };
  } catch (error) {
    console.error("Enrollment update failed:", error);
    return { ok: false, error: "Unable to update the enrollment." };
  }
}

function parseExpiry(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validationError(error: z.ZodError): EnrollmentActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) fieldErrors[issue.path.join(".") || "form"] ??= issue.message;
  return { ok: false, fieldErrors };
}

function revalidateEnrollmentPaths(studentId: string, courseId: string) {
  revalidatePath("/office/enrollments");
  revalidatePath(`/office/students/${studentId}`);
  revalidatePath("/student/courses");
  revalidatePath(`/student/courses/${courseId}`);
  revalidatePath("/student/dashboard");
}
