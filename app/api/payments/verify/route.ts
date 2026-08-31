import { NextRequest, NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { finalizeSuccessfulPayment } from "@/lib/payments/service";
import { sendPaymentConfirmedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { user: student, error } = await getValidatedStudent();
    if (!student || error) {
      return NextResponse.json(
        { success: false, error: error || "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    if (!paymentId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment verification parameters" },
        { status: 400 }
      );
    }

    // Verify payment belongs to this student
    const { Payment } = await import("@/lib/mongodb/models");
    const payment = await Payment.findById(paymentId).lean();
    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found" },
        { status: 404 }
      );
    }

    if (payment.student.toString() !== student.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Finalize payment
    const result = await finalizeSuccessfulPayment({
      paymentId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Payment verification failed" },
        { status: 400 }
      );
    }

    // Send enrollment confirmation email (non-blocking)
    if (result.enrollmentId) {
      try {
        const { Course } = await import("@/lib/mongodb/models");
        const course = await Course.findById(payment.course).select("name").lean();
        if (course) {
          await sendPaymentConfirmedEmail({
            studentId: student.id,
            studentName: student.name,
            studentEmail: student.email,
            courseId: payment.course.toString(),
            courseName: course.name,
            paymentId: payment._id.toString(),
            amount: payment.amount,
            currency: payment.currency,
            receiptNumber: payment.receiptNumber,
            paidAt: payment.paidAt ?? new Date(),
          });
        }
      } catch (emailError) {
        console.error("Failed to send enrollment confirmation email:", emailError);
        // Don't fail the payment if email fails
      }
    }

    return NextResponse.json(
      { success: true, enrollmentId: result.enrollmentId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}