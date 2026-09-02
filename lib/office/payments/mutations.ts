"use server";

import { revalidatePath } from "next/cache";

import { getValidatedSession } from "@/lib/auth/helpers";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/connect";
import { Payment, Enrollment } from "@/lib/mongodb/models";
import { ENROLLMENT_STATUSES, PAYMENT_PROVIDERS, PAYMENT_STATUSES } from "@/lib/constants";
import { getRazorpayInstance } from "@/lib/payments/razorpay";
import { recordAuditEvent } from "@/lib/audit/log";

export interface RefundActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Refund a captured Razorpay payment (full refund) and flip the linked
 * enrollment to cancelled. Server-side only: re-reads the session, requires the
 * payments.refund permission and refuses any payment that isn't a captured
 * Razorpay PAID record.
 */
export async function refundPaymentAction(paymentId: string): Promise<RefundActionResult> {
  const { user } = await getValidatedSession();
  if (!user) return { ok: false, error: "Please sign in to continue." };
  if (!hasPermission(user.role, PERMISSIONS.PAYMENTS_REFUND)) {
    return { ok: false, error: "You do not have permission to refund payments." };
  }

  try {
    await connectDB();
    const payment = await Payment.findById(paymentId).lean();
    if (!payment) return { ok: false, error: "Payment record not found." };

    if (payment.provider !== PAYMENT_PROVIDERS.RAZORPAY) {
      return { ok: false, error: "Only Razorpay payments can be refunded here." };
    }
    if (payment.status !== PAYMENT_STATUSES.PAID) {
      return { ok: false, error: "Only paid payments can be refunded." };
    }
    if (!payment.razorpayPaymentId) {
      return { ok: false, error: "This payment has no captured Razorpay payment id." };
    }
    if ((payment.amount ?? 0) <= 0) {
      return { ok: false, error: "Nothing to refund on a zero-amount payment." };
    }

    // Issue the refund at Razorpay (full amount).
    const razorpay = getRazorpayInstance();
    let refundId: string | null = null;
    try {
      const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: payment.amount,
        notes: {
          officeRefund: "true",
          paymentId: payment._id.toString(),
          receipt: payment.receiptNumber,
        },
      });
      refundId = (refund as { id?: string }).id ?? null;
    } catch (error) {
      console.error("Razorpay refund failed:", error);
      return {
        ok: false,
        error: "Refund could not be processed by the payment gateway. Please retry.",
      };
    }

    // Mark the local payment refunded.
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: PAYMENT_STATUSES.REFUNDED,
          "metadata.refundId": refundId ?? null,
          "metadata.refundedAt": new Date().toISOString(),
          "metadata.refundedByUserId": user.id,
        },
        $unset: { failureCode: "", failureDescription: "" },
      }
    );

    // Flip the active enrollment for this student/course to cancelled.
    const enrollmentQuery = payment.enrollment
      ? { _id: payment.enrollment }
      : { student: payment.student, course: payment.course };
    await Enrollment.updateMany(
      { ...enrollmentQuery, status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.PENDING] } },
      {
        $set: {
          status: ENROLLMENT_STATUSES.CANCELLED,
          paymentStatus: PAYMENT_STATUSES.REFUNDED,
        },
      }
    );

    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "payment.refund",
      entityType: "payment",
      entityId: paymentId,
      metadata: {
        amountPaise: payment.amount,
        refundId,
        studentId: payment.student.toString(),
        courseId: payment.course.toString(),
        receiptNumber: payment.receiptNumber,
      },
    });

    revalidatePath("/office/payments");
    return {
      ok: true,
      message: `Refund initiated (${refundId ?? "refund id pending"}). Payment marked as refunded.`,
    };
  } catch (error) {
    console.error("Office refund action failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
