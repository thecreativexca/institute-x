"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelPaymentAction, refundPaymentAction, verifyPaymentAction } from "@/lib/office/payments/mutations";

export function PaymentActions({ paymentId, status, amount, canRefund }: { paymentId: string; status: string; amount: number; canRefund: boolean }) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const run = (action: () => Promise<{ ok: boolean; error?: string; message?: string }>) => startTransition(async () => { const result = await action(); setNotice(result.ok ? result.message ?? "Done." : result.error ?? "Action failed."); });
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {status === "pending" ? <><Button size="sm" onClick={() => run(() => verifyPaymentAction(paymentId))} disabled={pending}>Verify</Button><Button size="sm" variant="outline" onClick={() => run(() => cancelPaymentAction(paymentId))} disabled={pending}>Cancel</Button></> : null}
      {status === "verified" && canRefund ? <Button size="sm" variant="outline" onClick={() => { const reason = window.prompt("Refund reason"); if (reason) run(() => refundPaymentAction(paymentId, { amount: amount / 100, reason })); }} disabled={pending}>Record refund</Button> : null}
    </div>
    {notice ? <p className="text-xs text-slate-600">{notice}</p> : null}
  </div>;
}
