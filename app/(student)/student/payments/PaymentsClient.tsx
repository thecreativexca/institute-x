"use client";

import Link from "next/link";
import { CreditCard, Download, ReceiptText } from "lucide-react";

import { StudentPageHeader } from "@/components/student/student-page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/payments/format";

interface Fee { enrollmentId: string; courseName: string; courseSlug: string; currency: string; totalFee: number; totalPaid: number; remainingAmount: number; status: string }
interface Payment { id: string; amount: number; currency: string; status: string; receiptNumber: string | null; paymentMethod: string; paymentDate: string; courseName: string; isRefund: boolean }

export function PaymentsClient({ fees, payments }: { fees: Fee[]; payments: Payment[] }) {
  return <div className="mx-auto max-w-5xl space-y-6">
    <StudentPageHeader title="Fees & Payments" description="Review course fees, verified payments and downloadable receipts." icon={<CreditCard className="h-6 w-6" />} eyebrow="Billing & receipts" />
    <div className="grid gap-4 md:grid-cols-2">{fees.map((fee) => <Card key={fee.enrollmentId} className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{fee.courseName}</h2><Badge variant={fee.status === "paid" ? "success" : fee.status === "partially_paid" || fee.status === "pending_verification" ? "warning" : "neutral"}>{label(fee.status)}</Badge></div>{fee.courseSlug ? <Link href={`/student/courses/${fee.courseSlug}`} className="text-xs font-semibold text-primary-700">View course</Link> : null}</div><dl className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><dt className="text-xs text-slate-500">Course fee</dt><dd className="font-semibold">{formatCurrency(fee.totalFee, fee.currency)}</dd></div><div><dt className="text-xs text-slate-500">Total paid</dt><dd className="font-semibold text-emerald-700">{formatCurrency(fee.totalPaid, fee.currency)}</dd></div><div><dt className="text-xs text-slate-500">Remaining</dt><dd className="font-semibold text-amber-800">{formatCurrency(fee.remainingAmount, fee.currency)}</dd></div></dl>{fee.remainingAmount > 0 ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Please contact the institute/office to complete your payment.</p> : null}</Card>)}</div>
    <section><h2 className="mb-3 text-lg font-semibold text-slate-900">Payment history</h2>{payments.length === 0 ? <Card className="py-8"><EmptyState icon={<ReceiptText className="h-10 w-10" />} title="No payments recorded" description="Payments recorded by the institute will appear here." /></Card> : <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment.id}><td className="px-4 py-3">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(payment.paymentDate))}</td><td className="px-4 py-3 font-medium">{payment.courseName}</td><td className="px-4 py-3 font-semibold">{payment.isRefund ? "−" : ""}{formatCurrency(payment.amount, payment.currency)}</td><td className="px-4 py-3">{label(payment.paymentMethod)}</td><td className="px-4 py-3">{payment.receiptNumber ? <a href={`/api/payments/${payment.id}/receipt`} className="inline-flex items-center gap-1 font-mono text-xs text-primary-700"><Download className="h-3.5 w-3.5" />{payment.receiptNumber}</a> : "—"}</td><td className="px-4 py-3"><Link href={`/student/payments/${payment.id}`}><Badge variant={payment.status === "verified" ? "success" : payment.status === "pending" ? "warning" : "neutral"}>{label(payment.status)}</Badge></Link></td></tr>)}</tbody></table></div></Card>}</section>
  </div>;
}
function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
