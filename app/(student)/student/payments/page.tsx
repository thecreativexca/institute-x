import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentPayments } from "@/lib/payments/service";
import { PaymentsClient } from "./PaymentsClient";

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
  };
}

export const metadata: Metadata = {
  title: "Payment History",
  description: "View your payment history",
  robots: { index: false, follow: false },
};

export default async function PaymentsPage() {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login");
  }

  const payments = await getStudentPayments(student.id);

  // Convert ObjectId to string for client component
  const paymentsForClient: PaymentForClient[] = payments.map((payment) => ({
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
    enrollment: payment.enrollment ? { status: payment.enrollment.status } : undefined,
  }));

  return <PaymentsClient payments={paymentsForClient} />;
}