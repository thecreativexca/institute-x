import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { formatCurrency } from "@/lib/payments/format";
import { getPaymentForStudent } from "@/lib/payments/service";

export const metadata: Metadata = { title: "Payment Details", robots: { index: false, follow: false } };

export default async function PaymentDetailPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { user } = await getValidatedStudent();
  if (!user) redirect("/login?reauth=1");
  const payment = await getPaymentForStudent((await params).paymentId, user.id);
  if (!payment) notFound();
  const reference = payment.upiReference ?? payment.transactionReference ?? payment.chequeNumber ?? "—";
  return <div className="mx-auto max-w-3xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Payment record</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{payment.course?.name ?? "Course payment"}</h1><p className="text-sm text-slate-500">{payment.receiptNumber ?? "Receipt available after verification"}</p></header>
    <Card className="p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm text-slate-500">{payment.isRefund ? "Refund amount" : "Amount"}</p><p className="text-2xl font-bold text-slate-900">{payment.isRefund ? "−" : ""}{formatCurrency(payment.amount, payment.currency)}</p></div><Badge variant={payment.status === "verified" ? "success" : payment.status === "pending" ? "warning" : "neutral"}>{label(payment.status)}</Badge></div><dl className="grid gap-4 text-sm sm:grid-cols-2">{[
      ["Payment date", new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(payment.paymentDate ?? payment.createdAt)], ["Payment method", label(payment.paymentMethod ?? "other")], ["Reference", reference], ["Recorded by", payment.recordedBy?.name ?? "Institute office"], ["Total course fee", formatCurrency(payment.balance.totalFee, payment.currency)], ["Total paid", formatCurrency(payment.balance.totalPaid, payment.currency)], ["Remaining balance", formatCurrency(payment.balance.remainingAmount, payment.currency)], ["Fee status", label(payment.balance.status)],
    ].map(([key,value]) => <div key={key}><dt className="text-slate-500">{key}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}</dl>{payment.notes ? <div className="mt-5 border-t pt-4 text-sm"><p className="text-slate-500">Notes</p><p className="mt-1 text-slate-800">{payment.notes}</p></div> : null}{payment.paymentProof?.url ? <a href={payment.paymentProof.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-primary-700">View payment proof</a> : null}</Card>
    <div className="flex flex-wrap gap-3"><Link href="/student/payments" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">Back to history</Link>{payment.receiptNumber ? <a href={`/api/payments/${payment._id.toString()}/receipt`} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white">Download receipt PDF</a> : null}</div>
  </div>;
}
function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
