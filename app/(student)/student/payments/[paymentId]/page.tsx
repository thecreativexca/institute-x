import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getPaymentForStudent } from "@/lib/payments/service";
import { Types } from "mongoose";
import { PaymentDetailClient } from "./PaymentDetailClient";

interface PaymentDetailPageProps {
  params: Promise<{ paymentId: string }>;
}

interface PaymentForClient {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  receiptNumber: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paidAt?: Date | string | null;
  createdAt: Date | string;
  course?: {
    _id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
  };
  enrollment?: {
    status: string;
    _id: string;
  };
}

export const metadata: Metadata = {
  title: "Payment Details",
  description: "View payment details and receipt",
  robots: { index: false, follow: false },
};

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const { paymentId } = await params;

  if (!Types.ObjectId.isValid(paymentId)) {
    notFound();
  }

  const payment = await getPaymentForStudent(paymentId, student.id);

  if (!payment) {
    notFound();
  }

  // Convert ObjectId to string for client component
  const paymentForClient: PaymentForClient = {
    _id: payment._id.toString(),
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    receiptNumber: payment.receiptNumber,
    razorpayPaymentId: payment.razorpayPaymentId,
    razorpayOrderId: payment.razorpayOrderId,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    course: payment.course ? {
      _id: payment.course._id.toString(),
      name: payment.course.name,
      slug: payment.course.slug,
      thumbnailUrl: payment.course.thumbnailUrl,
    } : undefined,
    enrollment: payment.enrollment ? {
      status: payment.enrollment.status,
      _id: payment.enrollment._id.toString(),
    } : undefined,
  };

  return <PaymentDetailClient payment={paymentForClient} />;
}
