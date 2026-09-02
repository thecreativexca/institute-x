"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { refundPaymentAction } from "@/lib/office/payments/mutations";
import { formatCurrencyFromPaise } from "@/lib/analytics/format";

export interface RefundTarget {
  id: string;
  receiptNumber: string;
  studentName: string;
  courseName: string;
  /** Amount in paise. */
  amount: number;
  currency: string;
}

/**
 * Confirm-and-refund for a captured Razorpay payment. Calls the server action
 * (which re-checks permission server-side), then refreshes the list.
 */
export function RefundButton({ payment }: { payment: RefundTarget }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function confirmRefund() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await refundPaymentAction(payment.id);
      if (!result.ok) {
        setError(result.error ?? "Refund could not be processed.");
        return;
      }
      setMessage(result.message ?? "Refund processed.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Refund
      </Button>
      <Modal
        open={open}
        onClose={() => {
          if (!isPending) setOpen(false);
        }}
        title="Refund this payment?"
        description="This issues a full refund through Razorpay and cancels the student's enrollment."
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{payment.courseName}</p>
          <p className="mt-1 text-slate-600">Student: {payment.studentName}</p>
          <p className="text-slate-600">Order: {payment.receiptNumber}</p>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {formatCurrencyFromPaise(payment.amount, payment.currency)}
          </p>
        </div>
        {error ? (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRefund} isLoading={isPending}>
            Confirm refund
          </Button>
        </div>
      </Modal>
    </>
  );
}
