import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentPayments } from "@/lib/payments/service";
import { PaymentsClient } from "./PaymentsClient";

export const metadata: Metadata = { title: "Fees & Payment History", robots: { index: false, follow: false } };

export default async function PaymentsPage() {
  const { user } = await getValidatedStudent();
  if (!user) redirect("/login?reauth=1");
  const result = await getStudentPayments(user.id);
  return <PaymentsClient
    fees={result.fees.map(({ enrollment, course, balance }) => ({
      enrollmentId: enrollment._id.toString(), courseName: course?.name ?? "Course", courseSlug: course?.slug ?? "",
      currency: course?.currency ?? "INR", totalFee: balance.totalFee, totalPaid: balance.totalPaid,
      remainingAmount: balance.remainingAmount, status: balance.status,
    }))}
    payments={result.payments.map((payment) => ({
      id: payment._id.toString(), amount: payment.amount, currency: payment.currency, status: payment.status,
      receiptNumber: payment.receiptNumber ?? null, paymentMethod: payment.paymentMethod ?? "other",
      paymentDate: (payment.paymentDate ?? payment.createdAt).toISOString(), courseName: payment.course?.name ?? "Course", isRefund: payment.isRefund ?? false,
    }))}
  />;
}
