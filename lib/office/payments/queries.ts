import "server-only";

import { Types } from "mongoose";

import {
  FEE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  USER_ROLES,
} from "@/lib/constants";
import type { SessionUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";
import { calculateEnrollmentBalance } from "@/lib/payments/calculate";
import { calculateRecordableAmount } from "@/lib/payments/calculation-rules";
import { rupeesToPaise } from "@/lib/payments/format";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";
import type {
  CourseSelectOption,
  OfficePaymentFilters,
  OfficePaymentRow,
  OfficePaymentsResult,
  OfficePaymentsSummary,
  PaymentEnrollmentOption,
} from "./dto";

export async function listOfficePayments(params: {
  session: SessionUser;
  filters: OfficePaymentFilters;
  page: number;
  pageSize: number;
}): Promise<OfficePaymentsResult> {
  await connectDB();
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const match = await buildMatch(params.session, params.filters);
  const [docs, total, summary] = await Promise.all([
    Payment.find(match).sort({ paymentDate: -1, createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Payment.countDocuments(match),
    getOfficePaymentsSummary(),
  ]);

  const studentIds = uniqueObjectIds(docs.map((doc) => doc.student));
  const courseIds = uniqueObjectIds(docs.map((doc) => doc.course));
  const enrollmentIds = uniqueObjectIds(docs.map((doc) => doc.enrollment));
  const adminIds = uniqueObjectIds(docs.flatMap((doc) => [doc.recordedBy, doc.verifiedBy].filter(Boolean) as Types.ObjectId[]));
  const [students, courses, enrollments, admins] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).select("name email phone").lean(),
    Course.find({ _id: { $in: courseIds } }).select("name price currency").lean(),
    Enrollment.find({ _id: { $in: enrollmentIds } }).select("paymentStatus").lean(),
    User.find({ _id: { $in: adminIds } }).select("name").lean(),
  ]);
  const studentMap = new Map(students.map((row) => [row._id.toString(), row]));
  const courseMap = new Map(courses.map((row) => [row._id.toString(), row]));
  const enrollmentMap = new Map(enrollments.map((row) => [row._id.toString(), row]));
  const adminMap = new Map(admins.map((row) => [row._id.toString(), row.name]));
  const balanceEntries = await Promise.all(enrollments.map(async (enrollment) => {
    const doc = docs.find((payment) => payment.enrollment?.toString() === enrollment._id.toString());
    const course = doc ? courseMap.get(doc.course.toString()) : null;
    return [enrollment._id.toString(), await calculateEnrollmentBalance(enrollment._id, rupeesToPaise(course?.price ?? 0))] as const;
  }));
  const balanceMap = new Map(balanceEntries);
  const lastDates = await Payment.aggregate<{ _id: Types.ObjectId; date: Date }>([
    { $match: { enrollment: { $in: enrollmentIds } } },
    { $group: { _id: "$enrollment", date: { $max: "$paymentDate" } } },
  ]);
  const lastDateMap = new Map(lastDates.map((row) => [row._id.toString(), row.date]));

  const payments: OfficePaymentRow[] = docs.map((payment) => {
    const enrollmentId = payment.enrollment?.toString() ?? "";
    const isLegacy = !enrollmentId || !payment.paymentMethod || !payment.paymentDate || !payment.recordedBy
      || !Object.values(PAYMENT_STATUSES).includes(payment.status);
    const student = studentMap.get(payment.student.toString());
    const course = courseMap.get(payment.course.toString());
    const enrollment = enrollmentId ? enrollmentMap.get(enrollmentId) : undefined;
    const balance = enrollmentId ? balanceMap.get(enrollmentId) : undefined;
    const paymentDate = payment.paymentDate ?? payment.createdAt;
    return {
      id: payment._id.toString(),
      receiptNumber: payment.receiptNumber ?? null,
      studentId: payment.student.toString(),
      studentName: student?.name ?? "Unknown student",
      studentEmail: student?.email ?? "",
      studentPhone: student?.phone ?? "",
      courseId: payment.course.toString(),
      courseName: course?.name ?? "Unknown course",
      enrollmentId,
      totalFee: balance?.totalFee ?? rupeesToPaise(course?.price ?? 0),
      totalPaid: balance?.totalPaid ?? 0,
      remainingAmount: balance?.remainingAmount ?? 0,
      feeStatus: balance?.status ?? enrollment?.paymentStatus ?? FEE_STATUSES.UNPAID,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod ?? PAYMENT_METHODS.OTHER,
      paymentDate: paymentDate.toISOString(),
      reference: payment.upiReference ?? payment.transactionReference ?? payment.chequeNumber ?? null,
      lastPaymentDate: enrollmentId ? lastDateMap.get(enrollmentId)?.toISOString() ?? null : null,
      recordedBy: payment.recordedBy ? adminMap.get(payment.recordedBy.toString()) ?? "Administrator" : "Historical import",
      verifiedBy: payment.verifiedBy ? adminMap.get(payment.verifiedBy.toString()) ?? "Administrator" : null,
      proofUrl: payment.paymentProof?.url ?? null,
      isRefund: payment.isRefund ?? false,
      originalPaymentId: payment.originalPayment?.toString() ?? null,
      refundReason: payment.refundReason ?? null,
      notes: payment.notes ?? null,
      isLegacy,
    };
  });
  return { payments, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), summary };
}

export async function getOfficeCourseOptions(): Promise<CourseSelectOption[]> {
  await connectDB();
  const courses = await Course.find().select("name").sort({ name: 1 }).lean();
  return courses.map((course) => ({ id: course._id.toString(), name: course.name }));
}

export async function getPaymentEnrollmentOptions(): Promise<PaymentEnrollmentOption[]> {
  await connectDB();
  const enrollments = await Enrollment.find({ status: { $ne: "cancelled" } }).sort({ enrolledAt: -1 }).lean();
  const [students, courses] = await Promise.all([
    User.find({ _id: { $in: enrollments.map((row) => row.student) }, role: USER_ROLES.STUDENT }).select("name email").lean(),
    Course.find({ _id: { $in: enrollments.map((row) => row.course) } }).select("name price currency").lean(),
  ]);
  const studentsById = new Map(students.map((row) => [row._id.toString(), row]));
  const coursesById = new Map(courses.map((row) => [row._id.toString(), row]));
  const results = await Promise.all(enrollments.map(async (enrollment) => {
    const student = studentsById.get(enrollment.student.toString());
    const course = coursesById.get(enrollment.course.toString());
    if (!student || !course) return null;
    const totalFee = rupeesToPaise(course.price ?? 0);
    const balance = await calculateEnrollmentBalance(enrollment._id, totalFee);
    return {
      enrollmentId: enrollment._id.toString(), studentId: student._id.toString(), studentName: student.name,
      studentEmail: student.email, courseId: course._id.toString(), courseName: course.name,
      totalFee, totalPaid: balance.totalPaid, remainingAmount: balance.remainingAmount,
      pendingAmount: balance.pendingAmount,
      recordableAmount: calculateRecordableAmount(balance),
      currency: course.currency || "INR",
    } satisfies PaymentEnrollmentOption;
  }));
  return results.filter((row): row is PaymentEnrollmentOption => Boolean(row && row.recordableAmount > 0));
}

export async function getOfficePaymentsSummary(): Promise<OfficePaymentsSummary> {
  await connectDB();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const [collections, pendingCount, enrollments, courses] = await Promise.all([
    Payment.aggregate<{ _id: string; total: number; today: number; month: number }>([
      { $match: { status: { $in: [PAYMENT_STATUSES.VERIFIED, PAYMENT_STATUSES.REFUNDED] } } },
      { $group: { _id: "$paymentMethod", total: { $sum: { $cond: ["$isRefund", { $multiply: ["$amount", -1] }, "$amount"] } }, today: { $sum: { $cond: [{ $gte: ["$paymentDate", today] }, { $cond: ["$isRefund", { $multiply: ["$amount", -1] }, "$amount"] }, 0] } }, month: { $sum: { $cond: [{ $gte: ["$paymentDate", month] }, { $cond: ["$isRefund", { $multiply: ["$amount", -1] }, "$amount"] }, 0] } } } },
    ]),
    Payment.countDocuments({ status: PAYMENT_STATUSES.PENDING }),
    Enrollment.find().select("course paymentStatus").lean(),
    Course.find().select("price").lean(),
  ]);
  const courseMap = new Map(courses.map((course) => [course._id.toString(), course]));
  const balances = await Promise.all(enrollments.map((enrollment) => calculateEnrollmentBalance(enrollment._id, rupeesToPaise(courseMap.get(enrollment.course.toString())?.price ?? 0))));
  const byMethod = Object.fromEntries(Object.values(PAYMENT_METHODS).map((method) => [method, collections.find((row) => row._id === method)?.total ?? 0]));
  return {
    todayCollected: collections.reduce((sum, row) => sum + row.today, 0),
    monthCollected: collections.reduce((sum, row) => sum + row.month, 0),
    totalCollected: collections.reduce((sum, row) => sum + row.total, 0),
    pendingCount,
    outstandingAmount: balances.reduce((sum, balance) => sum + balance.remainingAmount, 0),
    paidStudents: balances.filter((balance) => balance.status === FEE_STATUSES.PAID).length,
    partiallyPaidStudents: balances.filter((balance) => balance.status === FEE_STATUSES.PARTIALLY_PAID).length,
    unpaidStudents: balances.filter((balance) => balance.status === FEE_STATUSES.UNPAID || balance.status === FEE_STATUSES.PENDING_VERIFICATION).length,
    byMethod,
  };
}

async function buildMatch(session: SessionUser, filters: OfficePaymentFilters): Promise<Record<string, unknown>> {
  if (session.role !== USER_ROLES.ADMIN) return { _id: new Types.ObjectId("000000000000000000000000") };
  const clauses: Record<string, unknown>[] = [];
  if (filters.status && filters.status !== "ALL" && Object.values(PAYMENT_STATUSES).includes(filters.status)) clauses.push({ status: filters.status });
  if (filters.paymentMethod && filters.paymentMethod !== "ALL" && Object.values(PAYMENT_METHODS).includes(filters.paymentMethod)) clauses.push({ paymentMethod: filters.paymentMethod });
  if (filters.courseId && Types.ObjectId.isValid(filters.courseId)) clauses.push({ course: new Types.ObjectId(filters.courseId) });
  if (filters.search?.trim()) {
    const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
    const users = await User.find({ role: USER_ROLES.STUDENT, $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select("_id").lean();
    const idMatch = Types.ObjectId.isValid(filters.search.trim()) ? [new Types.ObjectId(filters.search.trim())] : [];
    clauses.push({ $or: [
      { student: { $in: [...users.map((row) => row._id), ...idMatch] } },
      { receiptNumber: regex }, { transactionReference: regex }, { upiReference: regex }, { chequeNumber: regex },
    ] });
  }
  const dateRange: Record<string, Date> = {};
  if (filters.from) { const date = new Date(`${filters.from}T00:00:00+05:30`); if (!Number.isNaN(date.getTime())) dateRange.$gte = date; }
  if (filters.to) { const date = new Date(`${filters.to}T23:59:59.999+05:30`); if (!Number.isNaN(date.getTime())) dateRange.$lte = date; }
  if (Object.keys(dateRange).length) clauses.push({ paymentDate: dateRange });
  return clauses.length ? { $and: clauses } : {};
}

function uniqueObjectIds(values: Array<Types.ObjectId | string | null | undefined>): Types.ObjectId[] {
  const validValues = values.flatMap((value) => value && Types.ObjectId.isValid(value) ? [value.toString()] : []);
  return [...new Set(validValues)]
    .map((value) => new Types.ObjectId(value));
}

function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
