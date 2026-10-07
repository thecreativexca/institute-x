import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getValidatedSession } from "@/lib/auth/helpers";
import { USER_ROLES, PAYMENT_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { calculateEnrollmentBalance } from "@/lib/payments/calculate";
import { rupeesToPaise } from "@/lib/payments/format";
import { generatePaymentReceiptPdf } from "@/lib/payments/receipt";
import { Course, Payment, User } from "@/lib/mongodb/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ paymentId: string }> }) {
  const { user } = await getValidatedSession();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { paymentId } = await context.params;
  if (!Types.ObjectId.isValid(paymentId)) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  await connectDB();
  const match: Record<string, unknown> = { _id: paymentId };
  if (user.role === USER_ROLES.STUDENT) match.student = new Types.ObjectId(user.id);
  else if (user.role !== USER_ROLES.ADMIN) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const payment = await Payment.findOne(match).lean();
  if (!payment || !payment.enrollment || !payment.paymentMethod || !payment.paymentDate || !payment.receiptNumber || (payment.status !== PAYMENT_STATUSES.VERIFIED && payment.status !== PAYMENT_STATUSES.REFUNDED)) {
    return NextResponse.json({ success: false, error: "A verified receipt is not available." }, { status: 404 });
  }
  const [student, course] = await Promise.all([
    User.findById(payment.student).select("name").lean(),
    Course.findById(payment.course).select("name price").lean(),
  ]);
  if (!student || !course) return NextResponse.json({ success: false, error: "Receipt data is incomplete." }, { status: 404 });
  const balance = await calculateEnrollmentBalance(payment.enrollment, rupeesToPaise(course.price ?? 0));
  const pdf = await generatePaymentReceiptPdf({
    receiptNumber: payment.receiptNumber, studentName: student.name, studentId: payment.student.toString(), courseName: course.name,
    amount: payment.amount, currency: payment.currency, paymentMethod: payment.paymentMethod, paymentDate: payment.paymentDate,
    reference: payment.upiReference ?? payment.transactionReference ?? payment.chequeNumber ?? null,
    totalFee: balance.totalFee, totalPaid: balance.totalPaid, remainingAmount: balance.remainingAmount,
    paymentStatus: payment.status, generatedAt: new Date(), isRefund: payment.isRefund ?? false,
  });
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${payment.receiptNumber}.pdf"`, "Cache-Control": "private, no-store" } });
}
