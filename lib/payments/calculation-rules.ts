import { FEE_STATUSES, type FeeStatus } from "@/lib/constants";

export interface PaymentBalance {
  totalFee: number;
  verifiedPayments: number;
  refundedAmount: number;
  totalPaid: number;
  remainingAmount: number;
  pendingAmount: number;
  status: FeeStatus;
}

export function deriveFeeStatus(input: {
  totalFee: number;
  verifiedPayments: number;
  refundedAmount: number;
  pendingAmount: number;
  cancelledCount?: number;
}): PaymentBalance {
  const totalPaid = Math.max(0, input.verifiedPayments - input.refundedAmount);
  const remainingAmount = Math.max(0, input.totalFee - totalPaid);
  let status: FeeStatus;
  if (input.verifiedPayments > 0 && totalPaid === 0 && input.refundedAmount > 0) {
    status = FEE_STATUSES.REFUNDED;
  } else if (totalPaid >= input.totalFee) {
    status = FEE_STATUSES.PAID;
  } else if (totalPaid > 0) {
    status = FEE_STATUSES.PARTIALLY_PAID;
  } else if (input.pendingAmount > 0) {
    status = FEE_STATUSES.PENDING_VERIFICATION;
  } else if ((input.cancelledCount ?? 0) > 0) {
    status = FEE_STATUSES.CANCELLED;
  } else {
    status = FEE_STATUSES.UNPAID;
  }
  return {
    totalFee: input.totalFee,
    verifiedPayments: input.verifiedPayments,
    refundedAmount: input.refundedAmount,
    totalPaid,
    remainingAmount,
    pendingAmount: input.pendingAmount,
    status,
  };
}

export function calculateRecordableAmount(balance: Pick<PaymentBalance, "remainingAmount" | "pendingAmount">): number {
  return Math.max(0, balance.remainingAmount - balance.pendingAmount);
}
