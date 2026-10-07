"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { recordAuditEvent } from "@/lib/audit/log";
import { getValidatedSession } from "@/lib/auth/helpers";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { PAYMENT_METHODS, PAYMENT_STATUSES, USER_ROLES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { syncEnrollmentFeeStatus, calculateEnrollmentBalance } from "@/lib/payments/calculate";
import { calculateRecordableAmount } from "@/lib/payments/calculation-rules";
import { rupeesToPaise } from "@/lib/payments/format";
import { generateReceiptNumber } from "@/lib/payments/receipt-number";
import { Course, Enrollment, Payment, User } from "@/lib/mongodb/models";
import { notifyUser, safeNotify } from "@/lib/notifications/service";

export interface PaymentActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  paymentId?: string;
}

const proofSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  fileName: z.string().min(1).max(150),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().min(0).max(10 * 1024 * 1024),
});

const addPaymentSchema = z.object({
  enrollmentId: z.string().refine(Types.ObjectId.isValid, "Select a valid student and course."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  paymentDate: z.string().min(1, "Payment date is required."),
  paymentMethod: z.enum([
    PAYMENT_METHODS.CASH,
    PAYMENT_METHODS.CHEQUE,
    PAYMENT_METHODS.UPI,
    PAYMENT_METHODS.BANK_TRANSFER,
    PAYMENT_METHODS.OTHER,
  ]),
  transactionReference: z.string().trim().max(120).optional().default(""),
  chequeNumber: z.string().trim().max(80).optional().default(""),
  chequeDate: z.string().optional().default(""),
  bankName: z.string().trim().max(120).optional().default(""),
  upiReference: z.string().trim().max(120).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  status: z.enum([PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.VERIFIED]),
  paymentProof: proofSchema.nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.paymentMethod === PAYMENT_METHODS.CHEQUE) {
    if (!value.chequeNumber) ctx.addIssue({ code: "custom", path: ["chequeNumber"], message: "Cheque number is required." });
    if (!value.bankName) ctx.addIssue({ code: "custom", path: ["bankName"], message: "Bank name is required." });
    if (!value.chequeDate) ctx.addIssue({ code: "custom", path: ["chequeDate"], message: "Cheque date is required." });
  }
  if (value.paymentMethod === PAYMENT_METHODS.UPI && !value.upiReference) {
    ctx.addIssue({ code: "custom", path: ["upiReference"], message: "UPI reference is required." });
  }
  if (value.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER && !value.transactionReference) {
    ctx.addIssue({ code: "custom", path: ["transactionReference"], message: "Bank reference is required." });
  }
});

export type AddManualPaymentInput = z.input<typeof addPaymentSchema>;

async function getAdmin(permission: string) {
  const { user } = await getValidatedSession();
  if (!user || user.status !== "active" || user.role !== USER_ROLES.ADMIN) return null;
  if (!hasPermission(user.role, permission as never)) return null;
  return user;
}

export async function addManualPaymentAction(input: AddManualPaymentInput): Promise<PaymentActionResult> {
  const user = await getAdmin(PERMISSIONS.PAYMENTS_REFUND);
  if (!user) return { ok: false, error: "Administrator access is required." };
  const parsed = addPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: flattenErrors(parsed.error) };

  try {
    await connectDB();
    const enrollment = await Enrollment.findById(parsed.data.enrollmentId).lean();
    if (!enrollment) return { ok: false, fieldErrors: { enrollmentId: "Enrollment not found." } };
    const [student, course] = await Promise.all([
      User.findById(enrollment.student).select("name role status").lean(),
      Course.findById(enrollment.course).select("name price currency").lean(),
    ]);
    if (!student || student.role !== USER_ROLES.STUDENT) return { ok: false, error: "Student not found." };
    if (!course) return { ok: false, error: "Course not found." };

    const paymentDate = parseDate(parsed.data.paymentDate);
    const chequeDate = parsed.data.chequeDate ? parseDate(parsed.data.chequeDate) : null;
    if (!paymentDate) return { ok: false, fieldErrors: { paymentDate: "Enter a valid payment date." } };
    if (paymentDate.getTime() > Date.now() + 86_400_000) {
      return { ok: false, fieldErrors: { paymentDate: "Payment date cannot be in the future." } };
    }
    if (parsed.data.chequeDate && !chequeDate) {
      return { ok: false, fieldErrors: { chequeDate: "Enter a valid cheque date." } };
    }

    const amount = rupeesToPaise(parsed.data.amount);
    const totalFee = rupeesToPaise(course.price ?? 0);
    const balance = await calculateEnrollmentBalance(enrollment._id, totalFee);
    const recordableAmount = calculateRecordableAmount(balance);
    if (amount > recordableAmount) {
      return {
        ok: false,
        fieldErrors: { amount: `Amount cannot exceed ₹${(recordableAmount / 100).toLocaleString("en-IN")} after pending payments.` },
      };
    }

    const verified = parsed.data.status === PAYMENT_STATUSES.VERIFIED;
    const payment = await Payment.create({
      student: enrollment.student,
      course: enrollment.course,
      enrollment: enrollment._id,
      amount,
      currency: course.currency || "INR",
      paymentMethod: parsed.data.paymentMethod,
      paymentDate,
      transactionReference: parsed.data.transactionReference || undefined,
      chequeNumber: parsed.data.chequeNumber || undefined,
      chequeDate,
      bankName: parsed.data.bankName || undefined,
      upiReference: parsed.data.upiReference || undefined,
      notes: parsed.data.notes || undefined,
      paymentProof: parsed.data.paymentProof ?? null,
      status: parsed.data.status,
      receiptNumber: verified ? await generateReceiptNumber(paymentDate) : undefined,
      recordedBy: new Types.ObjectId(user.id),
      verifiedBy: verified ? new Types.ObjectId(user.id) : null,
      verifiedAt: verified ? new Date() : null,
      isRefund: false,
    });

    await syncEnrollmentFeeStatus(enrollment._id, totalFee);
    await auditPayment(user, payment._id.toString(), "payment.record", {
      studentId: enrollment.student.toString(), courseId: enrollment.course.toString(), amount,
      method: parsed.data.paymentMethod, status: parsed.data.status,
    });
    if (verified) await sendPaymentNotice(enrollment.student, course.name, amount, payment.receiptNumber);
    revalidatePaymentPaths(enrollment.student.toString(), payment._id.toString());
    return { ok: true, paymentId: payment._id.toString(), message: verified ? "Payment recorded and verified." : "Payment recorded for verification." };
  } catch (error) {
    console.error("Manual payment creation failed:", error);
    return { ok: false, error: "Unable to record the payment." };
  }
}

export async function verifyPaymentAction(paymentId: string): Promise<PaymentActionResult> {
  const user = await getAdmin(PERMISSIONS.PAYMENTS_REFUND);
  if (!user) return { ok: false, error: "Administrator access is required." };
  if (!Types.ObjectId.isValid(paymentId)) return { ok: false, error: "Invalid payment." };
  try {
    await connectDB();
    const payment = await Payment.findById(paymentId);
    if (!payment) return { ok: false, error: "Payment not found." };
    if (payment.status !== PAYMENT_STATUSES.PENDING) return { ok: false, error: "Only pending payments can be verified." };
    if (!payment.enrollment || !payment.paymentMethod || !payment.paymentDate || !payment.recordedBy) {
      return { ok: false, error: "Historical payment records cannot be changed from this workflow." };
    }
    const course = await Course.findById(payment.course).select("name price").lean();
    if (!course) return { ok: false, error: "Course not found." };
    const balance = await calculateEnrollmentBalance(payment.enrollment, rupeesToPaise(course.price ?? 0));
    if (payment.amount > balance.remainingAmount) return { ok: false, error: "This payment now exceeds the remaining course fee." };
    payment.status = PAYMENT_STATUSES.VERIFIED;
    payment.receiptNumber = await generateReceiptNumber(payment.paymentDate);
    payment.verifiedBy = new Types.ObjectId(user.id);
    payment.verifiedAt = new Date();
    await payment.save();
    await syncEnrollmentFeeStatus(payment.enrollment, rupeesToPaise(course.price ?? 0));
    await auditPayment(user, paymentId, "payment.verify", { amount: payment.amount });
    await sendPaymentNotice(payment.student, course.name, payment.amount, payment.receiptNumber);
    revalidatePaymentPaths(payment.student.toString(), paymentId);
    return { ok: true, message: "Payment verified and receipt generated." };
  } catch (error) {
    console.error("Payment verification failed:", error);
    return { ok: false, error: "Unable to verify the payment." };
  }
}

export async function cancelPaymentAction(paymentId: string): Promise<PaymentActionResult> {
  const user = await getAdmin(PERMISSIONS.PAYMENTS_REFUND);
  if (!user) return { ok: false, error: "Administrator access is required." };
  if (!Types.ObjectId.isValid(paymentId)) return { ok: false, error: "Invalid payment." };
  await connectDB();
  const payment = await Payment.findOne({ _id: paymentId, status: PAYMENT_STATUSES.PENDING });
  if (!payment) return { ok: false, error: "Only pending payments can be cancelled." };
  if (!payment.enrollment || !payment.paymentMethod || !payment.paymentDate || !payment.recordedBy) {
    return { ok: false, error: "Historical payment records cannot be changed from this workflow." };
  }
  payment.status = PAYMENT_STATUSES.CANCELLED;
  await payment.save();
  const course = await Course.findById(payment.course).select("price").lean();
  await syncEnrollmentFeeStatus(payment.enrollment, rupeesToPaise(course?.price ?? 0));
  await auditPayment(user, paymentId, "payment.cancel", { amount: payment.amount });
  revalidatePaymentPaths(payment.student.toString(), paymentId);
  return { ok: true, message: "Payment cancelled. Financial history was retained." };
}

export async function refundPaymentAction(
  paymentId: string,
  input?: { amount?: number; reason?: string },
): Promise<PaymentActionResult> {
  const user = await getAdmin(PERMISSIONS.PAYMENTS_REFUND);
  if (!user) return { ok: false, error: "Administrator access is required." };
  if (!Types.ObjectId.isValid(paymentId)) return { ok: false, error: "Invalid payment." };
  try {
    await connectDB();
    const original = await Payment.findById(paymentId).lean();
    if (!original || original.status !== PAYMENT_STATUSES.VERIFIED || original.isRefund) {
      return { ok: false, error: "Only verified payments can be refunded." };
    }
    if (!original.enrollment || !original.paymentMethod || !original.paymentDate || !original.recordedBy) {
      return { ok: false, error: "Historical payment records cannot be changed from this workflow." };
    }
    const refunded = await Payment.aggregate<{ total: number }>([
      { $match: { originalPayment: original._id, status: PAYMENT_STATUSES.REFUNDED } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const remainingRefundable = Math.max(0, original.amount - (refunded[0]?.total ?? 0));
    const amount = input?.amount == null ? remainingRefundable : rupeesToPaise(input.amount);
    const reason = input?.reason?.trim() ?? "";
    if (amount <= 0 || amount > remainingRefundable) return { ok: false, error: "Enter a valid refund amount." };
    if (!reason) return { ok: false, error: "Refund reason is required." };

    const refund = await Payment.create({
      student: original.student,
      course: original.course,
      enrollment: original.enrollment,
      amount,
      currency: original.currency,
      paymentMethod: original.paymentMethod,
      paymentDate: new Date(),
      transactionReference: original.transactionReference,
      notes: `Refund against ${original.receiptNumber ?? original._id.toString()}`,
      status: PAYMENT_STATUSES.REFUNDED,
      receiptNumber: await generateReceiptNumber(),
      recordedBy: new Types.ObjectId(user.id),
      verifiedBy: new Types.ObjectId(user.id),
      verifiedAt: new Date(),
      originalPayment: original._id,
      refundReason: reason,
      isRefund: true,
    });
    const course = await Course.findById(original.course).select("price").lean();
    await syncEnrollmentFeeStatus(original.enrollment, rupeesToPaise(course?.price ?? 0));
    await auditPayment(user, refund._id.toString(), "payment.refund", {
      originalPaymentId: original._id.toString(), amount, reason,
    });
    revalidatePaymentPaths(original.student.toString(), refund._id.toString());
    return { ok: true, paymentId: refund._id.toString(), message: "Refund recorded without deleting the original payment." };
  } catch (error) {
    console.error("Refund recording failed:", error);
    return { ok: false, error: "Unable to record the refund." };
  }
}

function parseDate(value: string): Date | null {
  const date = new Date(`${value}T12:00:00.000+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function flattenErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[issue.path.join(".") || "form"] ??= issue.message;
  return result;
}

async function auditPayment(
  user: { id: string; role: string },
  paymentId: string,
  action: "payment.record" | "payment.verify" | "payment.cancel" | "payment.refund",
  metadata: Record<string, unknown>,
) {
  await recordAuditEvent({ actorUserId: user.id, actorRole: user.role, action, entityType: "payment", entityId: paymentId, metadata });
}

async function sendPaymentNotice(studentId: Types.ObjectId, courseName: string, amount: number, receipt?: string) {
  await safeNotify(
    () => notifyUser({
      recipientId: studentId,
      title: "Payment verified",
      message: `Your payment of ₹${(amount / 100).toLocaleString("en-IN")} for ${courseName} was verified${receipt ? ` (${receipt})` : ""}.`,
      type: "success",
      link: "/student/payments",
    }),
    "Manual payment verification",
  );
}

function revalidatePaymentPaths(studentId: string, paymentId: string) {
  revalidatePath("/office/payments");
  revalidatePath("/office");
  revalidatePath("/office/analytics");
  revalidatePath("/student/payments");
  revalidatePath(`/student/payments/${paymentId}`);
  revalidatePath(`/office/students/${studentId}`);
  revalidatePath("/student/dashboard");
}
