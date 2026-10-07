import "server-only";

import { Types } from "mongoose";

import { FEE_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Enrollment } from "@/models/Enrollment";
import { Payment } from "@/models/Payment";
import { deriveFeeStatus, type PaymentBalance } from "./calculation-rules";

export { deriveFeeStatus, type PaymentBalance } from "./calculation-rules";

export async function calculateEnrollmentBalance(
  enrollmentId: string | Types.ObjectId,
  totalFee: number,
): Promise<PaymentBalance> {
  await connectDB();
  const id = typeof enrollmentId === "string" ? new Types.ObjectId(enrollmentId) : enrollmentId;
  const rows = await Payment.aggregate<{
    _id: string;
    amount: number;
    count: number;
  }>([
    { $match: { enrollment: id } },
    {
      $group: {
        _id: "$status",
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);
  if (rows.length === 0) {
    const enrollment = await Enrollment.findById(id).select("paymentStatus").lean();
    if (enrollment?.paymentStatus === FEE_STATUSES.PAID) {
      return deriveFeeStatus({
        totalFee,
        verifiedPayments: totalFee,
        refundedAmount: 0,
        pendingAmount: 0,
      });
    }
  }
  const byStatus = new Map(rows.map((row) => [row._id, row]));
  return deriveFeeStatus({
    totalFee,
    verifiedPayments: byStatus.get(PAYMENT_STATUSES.VERIFIED)?.amount ?? 0,
    refundedAmount: byStatus.get(PAYMENT_STATUSES.REFUNDED)?.amount ?? 0,
    pendingAmount: byStatus.get(PAYMENT_STATUSES.PENDING)?.amount ?? 0,
    cancelledCount: byStatus.get(PAYMENT_STATUSES.CANCELLED)?.count ?? 0,
  });
}

export async function syncEnrollmentFeeStatus(
  enrollmentId: string | Types.ObjectId,
  totalFee: number,
): Promise<PaymentBalance> {
  const balance = await calculateEnrollmentBalance(enrollmentId, totalFee);
  await Enrollment.updateOne({ _id: enrollmentId }, { $set: { paymentStatus: balance.status } });
  return balance;
}
