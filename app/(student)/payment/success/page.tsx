import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { Payment, Course, Enrollment } from "@/lib/mongodb/models";
import { connectDB } from "@/lib/db/connect";
import { Types } from "mongoose";
import { SuccessClient } from "./SuccessClient";

interface SuccessPageProps {
  searchParams: Promise<{ paymentId?: string }>;
}

interface PaymentForClient {
  _id: string;
  amount: number;
  currency: string;
  receiptNumber: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paidAt?: Date | string | null;
  course: {
    _id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
  };
  enrollment?: {
    status: string;
  };
}

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your payment was successful",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const params = await searchParams;
  const paymentId = params.paymentId;

  if (!paymentId || !Types.ObjectId.isValid(paymentId)) {
    redirect("/student/dashboard");
  }

  await connectDB();

  const payment = await Payment.findOne({
    _id: paymentId,
    student: new Types.ObjectId(student.id),
  }).lean();

  if (!payment) {
    redirect("/student/dashboard");
  }

  // Fetch course separately to ensure we have the data
  const course = await Course.findById(payment.course).select("name slug thumbnailUrl").lean();
  
  // Fetch enrollment if exists
  let enrollmentStatus: string | undefined;
  if (payment.enrollment) {
    const enrollment = await Enrollment.findById(payment.enrollment).select("status").lean();
    if (enrollment) {
      enrollmentStatus = enrollment.status;
    }
  }

  // Convert ObjectId to string for client component
  const paymentForClient: PaymentForClient = {
    _id: payment._id.toString(),
    amount: payment.amount,
    currency: payment.currency,
    receiptNumber: payment.receiptNumber,
    razorpayPaymentId: payment.razorpayPaymentId,
    razorpayOrderId: payment.razorpayOrderId,
    paidAt: payment.paidAt,
    course: course ? {
      _id: course._id.toString(),
      name: course.name,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl,
    } : {
      _id: payment.course.toString(),
      name: "Unknown Course",
      slug: "",
      thumbnailUrl: undefined,
    },
    enrollment: enrollmentStatus ? { status: enrollmentStatus } : undefined,
  };

  return <SuccessClient payment={paymentForClient} />;
}
