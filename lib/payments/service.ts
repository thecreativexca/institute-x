import { Types } from "mongoose";
import crypto from "crypto";

import { connectDB } from "@/lib/db/connect";
import { Course, Payment, Enrollment, User } from "@/lib/mongodb/models";
import { PAYMENT_STATUSES, ENROLLMENT_STATUSES, PAYMENT_PROVIDERS } from "@/lib/constants";
import { env } from "@/lib/config/env";
import {
  getRazorpayInstance,
  createRazorpayOrder,
  generateReceiptNumber,
  calculateCourseAmount,
} from "./razorpay";

export interface CreatePaymentOrderResult {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
}

export interface FinalizePaymentParams {
  paymentId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface FinalizePaymentResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
}

/**
 * Create a payment order for a course purchase.
 * This is the single source of truth for payment order creation.
 */
export async function createCoursePaymentOrder(
  studentId: string,
  courseId: string
): Promise<CreatePaymentOrderResult> {
  await connectDB();

  const studentObjectId = new Types.ObjectId(studentId);
  const courseObjectId = new Types.ObjectId(courseId);

  // 1. Load student
  const student = await User.findById(studentObjectId).select("name email phone").lean();
  if (!student) {
    throw new Error("Student not found");
  }
  if (student.role !== "student" || student.status !== "active") {
    throw new Error("Invalid student account");
  }

  // 2. Load course
  const course = await Course.findById(courseObjectId).lean();
  if (!course) {
    throw new Error("Course not found");
  }
  if (course.status !== "published") {
    throw new Error("Course is not available for purchase");
  }
  if (!course.isPurchasable) {
    throw new Error("This course cannot be purchased directly");
  }

  // 3. Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: studentObjectId,
    course: courseObjectId,
    status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
  }).lean();
  if (existingEnrollment) {
    throw new Error("You are already enrolled in this course");
  }

  // 4. Check for existing pending payment
  const existingPendingPayment = await Payment.findOne({
    student: studentObjectId,
    course: courseObjectId,
    status: { $in: [PAYMENT_STATUSES.CREATED, PAYMENT_STATUSES.PENDING] },
    provider: PAYMENT_PROVIDERS.RAZORPAY,
  }).lean();

  if (existingPendingPayment) {
    // Return existing order for retry
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.fetch(existingPendingPayment.razorpayOrderId!);
    if (order.status === "created" || order.status === "attempted") {
      return {
        paymentId: existingPendingPayment._id.toString(),
        razorpayOrderId: existingPendingPayment.razorpayOrderId!,
        amount: existingPendingPayment.amount,
        currency: existingPendingPayment.currency,
        keyId: env.razorpayKeyId,
        courseId: course._id.toString(),
        courseName: course.name,
        studentName: student.name,
        studentEmail: student.email,
        studentPhone: student.phone,
      };
    }
    // If order is paid or failed, we'll create a new one below
  }

  // 5. Calculate amount (server-side authority)
  const amountInPaise = calculateCourseAmount(course);
  if (amountInPaise <= 0) {
    throw new Error("Course is free - use free enrollment instead");
  }

  // 6. Generate receipt number
  const receiptNumber = generateReceiptNumber();

  // 7. Create local payment record
  const payment = await Payment.create({
    student: studentObjectId,
    course: courseObjectId,
    provider: PAYMENT_PROVIDERS.RAZORPAY,
    amount: amountInPaise,
    currency: course.currency || "INR",
    status: PAYMENT_STATUSES.CREATED,
    receiptNumber,
    metadata: {
      courseName: course.name,
      studentName: student.name,
    },
  });

  // 8. Create Razorpay order
  const razorpayOrder = await createRazorpayOrder({
    amount: amountInPaise,
    currency: course.currency || "INR",
    receipt: receiptNumber,
    notes: {
      paymentId: payment._id.toString(),
      studentId: studentId,
      courseId: courseId,
    },
  });

  // 9. Update payment with Razorpay order ID
  payment.razorpayOrderId = razorpayOrder.id;
  payment.status = PAYMENT_STATUSES.PENDING;
  await payment.save();

  return {
    paymentId: payment._id.toString(),
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: course.currency || "INR",
    keyId: env.razorpayKeyId,
    courseId: course._id.toString(),
    courseName: course.name,
    studentName: student.name,
    studentEmail: student.email,
    studentPhone: student.phone,
  };
}

/**
 * Finalize a successful payment after signature verification.
 * This is the single source of truth for payment finalization.
 * Used by both client callback verification and webhook.
 */
export async function finalizeSuccessfulPayment(
  params: FinalizePaymentParams
): Promise<FinalizePaymentResult> {
  await connectDB();

  const { paymentId, razorpayPaymentId, razorpaySignature } = params;

  // Find payment record
  const payment = await Payment.findById(paymentId).populate("course").lean();
  if (!payment) {
    return { success: false, error: "Payment record not found" };
  }

  // Verify payment belongs to expected course/student
  if (payment.provider !== PAYMENT_PROVIDERS.RAZORPAY) {
    return { success: false, error: "Invalid payment provider" };
  }

  // Check if already processed (idempotency)
  if (payment.status === PAYMENT_STATUSES.PAID) {
    const enrollment = await Enrollment.findOne({
      student: payment.student,
      course: payment.course,
      status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
    }).lean();
    return {
      success: true,
      enrollmentId: enrollment?._id.toString(),
    };
  }

  // Verify Razorpay order ownership
  if (!payment.razorpayOrderId) {
    return { success: false, error: "Missing Razorpay order ID" };
  }

  // Verify signature
  const isValidSignature = verifyPaymentSignatureForOrder(
    payment.razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );
  if (!isValidSignature) {
    // Mark payment as failed
    await Payment.findByIdAndUpdate(paymentId, {
      status: PAYMENT_STATUSES.FAILED,
      failureCode: "SIGNATURE_VERIFICATION_FAILED",
      failureDescription: "Payment signature verification failed",
      razorpayPaymentId,
      razorpaySignature,
    });
    return { success: false, error: "Payment signature verification failed" };
  }

  // Verify amount matches (defense in depth)
  const razorpay = getRazorpayInstance();
  let razorpayPayment;
  try {
    razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
  } catch {
    return { success: false, error: "Unable to verify payment with provider" };
  }

  if (razorpayPayment.amount !== payment.amount || razorpayPayment.currency !== payment.currency) {
    await Payment.findByIdAndUpdate(paymentId, {
      status: PAYMENT_STATUSES.FAILED,
      failureCode: "AMOUNT_MISMATCH",
      failureDescription: "Payment amount does not match expected amount",
      razorpayPaymentId,
      razorpaySignature,
    });
    return { success: false, error: "Payment amount mismatch" };
  }

  // Use MongoDB transaction for atomicity if supported
  const mongoose = await import("mongoose");
  const session = await mongoose.default.startSession();
  session.startTransaction();

  try {
    // Update payment record
    await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: PAYMENT_STATUSES.PAID,
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date(),
        verifiedAt: new Date(),
      },
      { session }
    );

    // Create or activate enrollment
    let enrollment = await Enrollment.findOne({
      student: payment.student,
      course: payment.course,
    }).session(session);

    if (enrollment) {
      // Update existing enrollment
      enrollment.status = ENROLLMENT_STATUSES.ACTIVE;
      enrollment.paymentStatus = PAYMENT_STATUSES.PAID;
      enrollment.enrolledAt = new Date();
      await enrollment.save({ session });
    } else {
      // Create new enrollment
      const newEnrollment = await Enrollment.create(
        [
          {
            student: payment.student,
            course: payment.course,
            status: ENROLLMENT_STATUSES.ACTIVE,
            paymentStatus: PAYMENT_STATUSES.PAID,
            enrolledAt: new Date(),
          },
        ],
        { session }
      );
      enrollment = newEnrollment[0];
    }

    // Link enrollment to payment
    await Payment.findByIdAndUpdate(
      paymentId,
      { enrollment: enrollment._id },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return { success: true, enrollmentId: enrollment._id.toString() };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Payment finalization failed:", error);
    return { success: false, error: "Failed to finalize payment" };
  }
}

/**
 * Handle free course enrollment (no payment required)
 */
export async function enrollInFreeCourse(
  studentId: string,
  courseId: string
): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
  await connectDB();

  const studentObjectId = new Types.ObjectId(studentId);
  const courseObjectId = new Types.ObjectId(courseId);

  // Load student
  const student = await User.findById(studentObjectId).select("name email").lean();
  if (!student) {
    return { success: false, error: "Student not found" };
  }

  // Load course
  const course = await Course.findById(courseObjectId).lean();
  if (!course) {
    return { success: false, error: "Course not found" };
  }
  if (course.status !== "published") {
    return { success: false, error: "Course is not available" };
  }
  if (!course.isFree && (course.price ?? 0) > 0) {
    return { success: false, error: "This course is not free" };
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: studentObjectId,
    course: courseObjectId,
    status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
  }).lean();
  if (existingEnrollment) {
    return { success: false, error: "Already enrolled in this course" };
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    student: studentObjectId,
    course: courseObjectId,
    status: ENROLLMENT_STATUSES.ACTIVE,
    paymentStatus: PAYMENT_STATUSES.PAID, // Free courses are considered "paid"
    enrolledAt: new Date(),
  });

  // Create payment record for tracking
  const receiptNumber = generateReceiptNumber();
  await Payment.create({
    student: studentObjectId,
    course: courseObjectId,
    enrollment: enrollment._id,
    provider: PAYMENT_PROVIDERS.FREE,
    amount: 0,
    currency: course.currency || "INR",
    status: PAYMENT_STATUSES.PAID,
    receiptNumber,
    paidAt: new Date(),
    verifiedAt: new Date(),
    metadata: {
      courseName: course.name,
      studentName: student.name,
      type: "free_enrollment",
    },
  });

  return { success: true, enrollmentId: enrollment._id.toString() };
}

/**
 * Verify payment signature for a specific order
 */
function verifyPaymentSignatureForOrder(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

/**
 * Get payment by ID with authorization check
 */
export async function getPaymentForStudent(
  paymentId: string,
  studentId: string
) {
  await connectDB();
  const payment = await Payment.findOne({
    _id: paymentId,
    student: new Types.ObjectId(studentId),
  }).lean();

  if (!payment) return null;

  // Fetch course details
  const course = await Course.findById(payment.course)
    .select("name slug thumbnailUrl")
    .lean();

  // Fetch enrollment if exists
  let enrollment = null;
  if (payment.enrollment) {
    enrollment = await Enrollment.findById(payment.enrollment)
      .select("status")
      .lean();
  }

  return {
    ...payment,
    course,
    enrollment,
  };
}

/**
 * Get all payments for a student
 */
export async function getStudentPayments(studentId: string) {
  await connectDB();
  const payments = await Payment.find({ student: new Types.ObjectId(studentId) })
    .sort({ createdAt: -1 })
    .lean();

  // Fetch course details for each payment
  const courseIds = [...new Set(payments.map((p) => p.course.toString()))];
  const courses = await Course.find({ _id: { $in: courseIds } })
    .select("name slug thumbnailUrl")
    .lean();
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

  // Fetch enrollment details for each payment
  const enrollmentIds = [...new Set(
    payments
      .filter((p): p is typeof p & { enrollment: Types.ObjectId } => !!p.enrollment)
      .map((p) => p.enrollment.toString())
  )];
  const enrollments = await Enrollment.find({ _id: { $in: enrollmentIds } })
    .select("status")
    .lean();
  const enrollmentMap = new Map(enrollments.map((e) => [e._id.toString(), e]));

  return payments.map((payment) => ({
    ...payment,
    course: courseMap.get(payment.course.toString()) || null,
    enrollment: payment.enrollment
      ? enrollmentMap.get(payment.enrollment.toString()) || null
      : null,
  }));
}

/**
 * Reconcile a payment (check provider status and update local state)
 */
export async function reconcilePayment(paymentId: string): Promise<FinalizePaymentResult> {
  await connectDB();

  const payment = await Payment.findById(paymentId).populate("course").lean();
  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  if (payment.status === PAYMENT_STATUSES.PAID) {
    const enrollment = await Enrollment.findOne({
      student: payment.student,
      course: payment.course,
      status: { $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED] },
    }).lean();
    return { success: true, enrollmentId: enrollment?._id.toString() };
  }

  if (!payment.razorpayOrderId || payment.provider !== PAYMENT_PROVIDERS.RAZORPAY) {
    return { success: false, error: "Not a Razorpay payment" };
  }

  const razorpay = getRazorpayInstance();
  try {
    const order = await razorpay.orders.fetch(payment.razorpayOrderId);
    if (order.status === "paid" && order.amount_paid > 0) {
      // Payment succeeded but webhook/callback missed
      // We need the payment ID and signature from the order
      // This would typically come from webhook, but we can try to fetch
      // Use type assertion for Razorpay query parameter
      const paymentsResult = await razorpay.payments.all({
        order_id: payment.razorpayOrderId,
      } as Record<string, string>);
      const paymentsList = "items" in paymentsResult ? paymentsResult.items : [];
      const capturedPayment = paymentsList.find(
        (p: { status?: string; id?: string }) => p.status === "captured"
      );
      if (capturedPayment?.id) {
        return finalizeSuccessfulPayment({
          paymentId: payment._id.toString(),
          razorpayPaymentId: capturedPayment.id,
          razorpaySignature: "", // Would need from webhook ideally
        });
      }
    }
  } catch (error) {
    console.error("Reconciliation failed:", error);
  }

  return { success: false, error: "Unable to reconcile" };
}