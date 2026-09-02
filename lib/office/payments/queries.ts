import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { PAYMENT_STATUSES, USER_ROLES } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth/session";
import type {
  CourseSelectOption,
  OfficePaymentFilters,
  OfficePaymentRow,
  OfficePaymentsResult,
  OfficePaymentsSummary,
} from "./dto";

const ALL_STATUSES = Object.values(PAYMENT_STATUSES) as string[];

/**
 * Office Payments & Orders queries. Two-role system: only ADMIN reaches this
 * area and ADMIN has global (unscoped) access — a non-admin never sees rows.
 */
export async function listOfficePayments(params: {
  session: SessionUser;
  filters: OfficePaymentFilters;
  page: number;
  pageSize: number;
}): Promise<OfficePaymentsResult> {
  await connectDB();
  const { filters, session } = params;
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));

  const match = buildMatch(session, filters);

  const [docs, total] = await Promise.all([
    Payment.find(match)
      .select(
        "student course enrollment provider razorpayOrderId razorpayPaymentId amount currency status receiptNumber failureDescription paidAt createdAt"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Payment.countDocuments(match),
  ]);

  const [users, courses, enrollments] = await Promise.all([
    User.find({ _id: { $in: uniqueIds(docs, "student") } }).select("name email").lean(),
    Course.find({ _id: { $in: uniqueIds(docs, "course") } }).select("name").lean(),
    Enrollment.find({ _id: { $in: uniqueIds(docs, "enrollment") } }).select("status").lean(),
  ]);
  const userById = new Map(users.map((u) => [u._id.toString(), u]));
  const courseById = new Map(courses.map((c) => [c._id.toString(), c]));
  const enrollmentById = new Map(enrollments.map((e) => [e._id.toString(), e]));

  const payments: OfficePaymentRow[] = docs.map((payment) => {
    const student = userById.get(String(payment.student));
    const course = courseById.get(String(payment.course));
    const enrollment = payment.enrollment
      ? enrollmentById.get(String(payment.enrollment))
      : undefined;
    return {
      id: payment._id.toString(),
      receiptNumber: payment.receiptNumber,
      studentName: student?.name ?? "Unknown student",
      studentEmail: student?.email ?? "",
      courseId: String(payment.course),
      courseName: course?.name ?? "Unknown course",
      amount: payment.amount,
      currency: payment.currency ?? "INR",
      status: payment.status,
      provider: payment.provider,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      enrollmentStatus: enrollment?.status,
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
      createdAt: payment.createdAt.toISOString(),
      failureDescription: payment.failureDescription,
    };
  });

  const summary = await computeSummary(match);

  return {
    payments,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    summary,
  };
}

export async function getOfficeCourseOptions(): Promise<CourseSelectOption[]> {
  await connectDB();
  const courses = await Course.find().select("name").sort({ name: 1 }).lean();
  return courses.map((c) => ({ id: c._id.toString(), name: c.name }));
}

async function computeSummary(
  match: Record<string, unknown>
): Promise<OfficePaymentsSummary> {
  await connectDB();
  const rows = await Payment.aggregate<{ _id: string; count: number; amountPaise: number }>([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 }, amountPaise: { $sum: "$amount" } } },
  ]);

  const byStatus: Record<string, { count: number; amountPaise: number }> = {};
  for (const row of rows) {
    byStatus[row._id] = { count: row.count, amountPaise: row.amountPaise };
  }
  const get = (status: string) => byStatus[status] ?? { count: 0, amountPaise: 0 };

  const paid = get(PAYMENT_STATUSES.PAID);
  const refunded = get(PAYMENT_STATUSES.REFUNDED);
  const failed = get(PAYMENT_STATUSES.FAILED);
  const pending =
    get(PAYMENT_STATUSES.CREATED).count + get(PAYMENT_STATUSES.PENDING).count;

  const grossPaise = paid.amountPaise;
  const refundedPaise = refunded.amountPaise;

  return {
    totalCount: rows.reduce((sum, r) => sum + r.count, 0),
    paidCount: paid.count,
    grossPaise,
    refundedCount: refunded.count,
    refundedPaise,
    netPaise: Math.max(0, grossPaise - refundedPaise),
    pendingCount: pending,
    failedCount: failed.count,
  };
}

function buildMatch(
  session: SessionUser,
  filters: OfficePaymentFilters
): Record<string, unknown> {
  const match: Record<string, unknown> = {};

  // Two-role guard: only ADMIN sees payments. Non-admin gets an impossible match.
  if (session.role !== USER_ROLES.ADMIN) {
    match.student = toObjectId("000000000000000000000000");
  }

  if (filters.status && filters.status !== "ALL" && ALL_STATUSES.includes(filters.status)) {
    match.status = filters.status;
  }
  if (filters.search && filters.search.trim()) {
    const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
    match.$or = [{ receiptNumber: regex }, { razorpayOrderId: regex }, { razorpayPaymentId: regex }];
  }
  if (filters.courseId && isValidId(filters.courseId)) {
    match.course = toObjectId(filters.courseId);
  }

  const range: Record<string, Date> = {};
  if (filters.from) {
    const from = new Date(filters.from);
    if (!Number.isNaN(from.getTime())) range.$gte = from;
  }
  if (filters.to) {
    const to = new Date(filters.to);
    if (!Number.isNaN(to.getTime())) range.$lt = to;
  }
  if (Object.keys(range).length > 0) {
    match.createdAt = range;
  }
  return match;
}

function uniqueIds<T>(docs: T[], field: keyof T & string): Types.ObjectId[] {
  const ids = new Set<string>();
  for (const doc of docs) {
    const value = doc[field] as unknown;
    if (value && Types.ObjectId.isValid(value as Types.ObjectId)) {
      ids.add((value as { toString(): string }).toString());
    }
  }
  return [...ids].map((id) => toObjectId(id));
}

function isValidId(value: string): boolean {
  return Types.ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
