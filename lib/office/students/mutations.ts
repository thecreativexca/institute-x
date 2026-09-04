import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Course } from "@/models/Course";
import { AuditLog } from "@/models/AuditLog";
import { Types } from "mongoose";
import { ACCOUNT_STATUSES, ENROLLMENT_STATUSES, PAYMENT_STATUSES, ENROLLMENT_SOURCES, ENROLLMENT_ACCESS_TYPES, type AccountStatus } from "@/lib/constants";
import { OfficeStudentDetail, ManualEnrollmentInput, ProfileUpdateInput, StudentStatusAction } from "./dto";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export async function updateStudentProfile(
  studentId: string,
  data: ProfileUpdateInput,
  actorId: string,
  actorRole: string
): Promise<OfficeStudentDetail | null> {
  await connectDB();

  const student = await User.findOne({ _id: toObjectId(studentId), role: "student" });
  if (!student) return null;

  const oldData = {
    name: student.name,
    phone: student.phone,
    email: student.email,
  };

  if (data.name !== undefined) student.name = data.name.trim();
  if (data.phone !== undefined) student.phone = data.phone?.trim() || undefined;
  if (data.email !== undefined) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: student._id } });
    if (existing) throw new Error("Email already in use");
    student.email = normalizedEmail;
    student.emailVerifiedAt = null;
  }

  await student.save();

  const changedFields: Record<string, { old: unknown; new: unknown }> = {};
  if (data.name !== undefined && data.name.trim() !== oldData.name) {
    changedFields.name = { old: oldData.name, new: data.name.trim() };
  }
  if (data.phone !== undefined && (data.phone?.trim() || "") !== (oldData.phone || "")) {
    changedFields.phone = { old: oldData.phone, new: data.phone?.trim() };
  }
  if (data.email !== undefined && data.email.toLowerCase().trim() !== oldData.email) {
    changedFields.email = { old: oldData.email, new: data.email.toLowerCase().trim() };
  }

  if (Object.keys(changedFields).length > 0) {
    await AuditLog.create({
      actorUserId: toObjectId(actorId),
      actorRole,
      action: "student.update",
      entityType: "user",
      entityId: student._id,
      metadata: { changedFields },
    });
  }

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
    enrollmentCounts: {
      total: await Enrollment.countDocuments({ student: student._id }),
      active: await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.ACTIVE }),
      completed: await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.COMPLETED }),
    },
  };
}

export async function updateStudentStatus(
  action: StudentStatusAction,
  actorId: string,
  actorRole: string
): Promise<OfficeStudentDetail | null> {
  await connectDB();

  const student = await User.findOne({ _id: toObjectId(action.studentId), role: "student" });
  if (!student) return null;

  const oldStatus = student.status;
  if (oldStatus === action.status) {
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
      enrollmentCounts: {
        total: await Enrollment.countDocuments({ student: student._id }),
        active: await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.ACTIVE }),
        completed: await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.COMPLETED }),
      },
    };
  }

  student.status = action.status;
  student.sessionVersion += 1;
  await student.save();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: action.status === ACCOUNT_STATUSES.SUSPENDED ? "student.suspend" : "student.update",
    entityType: "user",
    entityId: student._id,
    metadata: {
      oldStatus,
      newStatus: action.status,
      reason: action.reason,
    },
  });

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
    enrollmentCounts: {
      total: await Enrollment.countDocuments({ student: student._id }),
      active: await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.ACTIVE }),
      completed: await Enrollment.countDocuments({ student: student._id, status: ENROLLMENT_STATUSES.COMPLETED }),
    },
  };
}

export async function createManualEnrollment(
  input: ManualEnrollmentInput
): Promise<{ enrollmentId: string } | { error: string }> {
  await connectDB();

  const student = await User.findOne({ _id: toObjectId(input.studentId), role: "student" });
  if (!student) return { error: "Student not found" };

  if (student.status === ACCOUNT_STATUSES.SUSPENDED) {
    return { error: "Cannot enroll suspended student" };
  }

  const course = await Course.findById(toObjectId(input.courseId));
  if (!course) return { error: "Course not found" };

  if (course.status !== "published") {
    return { error: "Cannot enroll in unpublished course" };
  }

  const existing = await Enrollment.findOne({ student: student._id, course: course._id });
  if (existing) return { error: "Student already enrolled in this course" };

  const enrollment = await Enrollment.create({
    student: student._id,
    course: course._id,
    status: ENROLLMENT_STATUSES.ACTIVE,
    paymentStatus: PAYMENT_STATUSES.PAID,
    source: input.source === "FREE" ? ENROLLMENT_SOURCES.FREE_COURSE : ENROLLMENT_SOURCES.ADMIN_MANUAL,
    accessType: ENROLLMENT_ACCESS_TYPES.LIFETIME,
    notes: input.reason,
    enrolledAt: new Date(),
  });

  await AuditLog.create({
    actorUserId: toObjectId(input.enrolledBy),
    actorRole: "admin",
    action: "enrollment.manage",
    entityType: "enrollment",
    entityId: enrollment._id,
    metadata: {
      studentId: student._id.toString(),
      courseId: course._id.toString(),
      source: input.source,
      reason: input.reason,
    },
  });

  return { enrollmentId: enrollment._id.toString() };
}

export async function resendVerificationEmail(studentId: string, actorId: string, actorRole: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  const student = await User.findOne({ _id: toObjectId(studentId), role: "student" });
  if (!student) return { success: false, error: "Student not found" };

  if (student.emailVerifiedAt) {
    return { success: false, error: "Email already verified" };
  }

  // Respect a cooldown so staff cannot spam verification emails.
  const { generateSecureToken, hashToken, getTokenExpiry } = await import("@/lib/auth/tokens");
  const { sendVerificationEmail } = await import("@/lib/email");
  const { siteConfig } = await import("@/lib/config/site");

  const tokenExpiryMs = getTokenExpiry("verification");
  const COOLDOWN_MS = Math.min(60 * 1000, tokenExpiryMs);
  if (
    student.emailVerificationTokenExpiresAt &&
    new Date(student.emailVerificationTokenExpiresAt).getTime() - tokenExpiryMs + COOLDOWN_MS > Date.now()
  ) {
    return { success: false, error: "A verification email was recently sent. Please wait before requesting another." };
  }

  const rawToken = generateSecureToken();
  student.emailVerificationToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + getTokenExpiry("verification"));
  student.emailVerificationTokenExpiresAt = expiresAt;
  await student.save();

  const verificationUrl = `${siteConfig.url}/verify-email?token=${rawToken}`;
  const expiryHours = getTokenExpiry("verification") / (1000 * 60 * 60);

  await sendVerificationEmail({
    studentId: student._id.toString(),
    studentName: student.name,
    studentEmail: student.email,
    verificationUrl,
    expiryHours,
  });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "student.update",
    entityType: "user",
    entityId: student._id,
    metadata: { action: "resend_verification_email" },
  });

  return { success: true };
}

export async function getAvailableCoursesForEnrollment(studentId: string) {
  await connectDB();

  const student = await User.findOne({ _id: toObjectId(studentId), role: "student" });
  if (!student) return [];

  const enrolledCourseIds = await Enrollment.find({ student: student._id }).select("course").lean();
  const enrolledIds = enrolledCourseIds.map((e) => e.course.toString());

  const courses = await Course.find({
    status: "published",
    isDisplayed: true,
    _id: { $nin: enrolledIds },
  })
    .select("name slug price isFree")
    .lean();

  return courses.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    price: c.price,
    isFree: c.isFree,
  }));
}
