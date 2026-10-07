import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, CalendarDays, CircleDollarSign, Clock3, Search, Users } from "lucide-react";

import { ManualPaymentManager } from "@/components/office/payments/manual-payment-manager";
import { PaymentActions } from "@/components/office/payments/payment-actions";
import { OfficeShell } from "@/components/office/OfficeShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants";
import { getOfficeCourseOptions, getPaymentEnrollmentOptions, listOfficePayments } from "@/lib/office/payments/queries";
import { formatCurrency } from "@/lib/payments/format";

export const metadata: Metadata = { title: "Manual Payments — Office Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await getValidatedSession();
  const raw = await searchParams;
  if (!user) redirect("/office/login?callbackUrl=/office/payments");
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");
  if (!hasPermission(user.role, PERMISSIONS.PAYMENTS_READ)) redirect("/office");
  const page = Math.max(1, Number.parseInt(str(raw.page) || "1", 10) || 1);
  const [result, courses, enrollmentOptions] = await Promise.all([
    listOfficePayments({ session: user, filters: {
      status: enumValue(str(raw.status), Object.values(PAYMENT_STATUSES)),
      paymentMethod: enumValue(str(raw.method), Object.values(PAYMENT_METHODS)),
      search: str(raw.search), courseId: str(raw.course), from: str(raw.from), to: str(raw.to),
    }, page, pageSize: PAGE_SIZE }),
    getOfficeCourseOptions(), getPaymentEnrollmentOptions(),
  ]);
  const summary = result.summary;
  return <OfficeShell session={user}><div className="space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Finance</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Manual Payments</h1><p className="mt-1 text-sm text-slate-600">Record and verify cash, cheque, UPI, bank transfer and other office payments.</p></div><ManualPaymentManager options={enrollmentOptions} /></header>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric icon={CalendarDays} label="Today's collections" value={formatCurrency(summary.todayCollected)} />
      <Metric icon={CircleDollarSign} label="This month" value={formatCurrency(summary.monthCollected)} />
      <Metric icon={Banknote} label="Total collected" value={formatCurrency(summary.totalCollected)} />
      <Metric icon={Clock3} label="Pending payments" value={String(summary.pendingCount)} />
      <Metric icon={CircleDollarSign} label="Outstanding" value={formatCurrency(summary.outstandingAmount)} />
      <Metric icon={Users} label="Paid students" value={String(summary.paidStudents)} />
      <Metric icon={Users} label="Partially paid" value={String(summary.partiallyPaidStudents)} />
      <Metric icon={Users} label="Unpaid students" value={String(summary.unpaidStudents)} />
    </section>

    <Card><CardContent className="pt-5"><form method="get" className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <label className="xl:col-span-2"><span className={labelClass}><Search className="h-3.5 w-3.5" /> Search</span><input name="search" defaultValue={str(raw.search)} placeholder="Student, email, ID, receipt or reference" className={controlClass} /></label>
      <Filter label="Status" name="status" value={str(raw.status)} options={[["", "All statuses"], ...Object.values(PAYMENT_STATUSES).map((value) => [value, title(value)] as [string,string])]} />
      <Filter label="Method" name="method" value={str(raw.method)} options={[["", "All methods"], ...Object.values(PAYMENT_METHODS).filter((value) => value !== "free").map((value) => [value, title(value)] as [string,string])]} />
      <Filter label="Course" name="course" value={str(raw.course)} options={[["", "All courses"], ...courses.map((course) => [course.id, course.name] as [string,string])]} />
      <div className="flex items-end gap-2"><Button type="submit">Apply</Button><Link href="/office/payments" className="pb-2 text-sm text-slate-500 hover:text-slate-800">Clear</Link></div>
      <label><span className={labelClass}>From</span><input type="date" name="from" defaultValue={str(raw.from)} className={controlClass} /></label><label><span className={labelClass}>To</span><input type="date" name="to" defaultValue={str(raw.to)} className={controlClass} /></label>
    </form></CardContent></Card>

    <Card className="overflow-hidden">{result.payments.length === 0 ? <EmptyState title="No payment records found" description="Add a payment or adjust the filters." /> : <div className="overflow-x-auto"><table className="w-full min-w-[1380px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Student", "Course / fee", "Transaction", "Paid / remaining", "Status", "Last payment", "Audit", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{result.payments.map((payment) => <tr key={payment.id} className="align-top hover:bg-slate-50/60">
      <td className="px-4 py-4"><p className="font-semibold text-slate-900">{payment.studentName}</p><p className="text-xs text-slate-500">{payment.studentEmail}</p><p className="font-mono text-[11px] text-slate-400">{payment.studentId}</p>{payment.studentPhone ? <p className="text-xs text-slate-500">{payment.studentPhone}</p> : null}</td>
      <td className="px-4 py-4"><p className="font-medium text-slate-800">{payment.courseName}</p><p className="text-xs text-slate-500">Fee {formatCurrency(payment.totalFee, payment.currency)}</p></td>
      <td className="px-4 py-4"><p className="font-semibold text-slate-900">{payment.isRefund ? "−" : ""}{formatCurrency(payment.amount, payment.currency)}</p><p className="text-xs text-slate-500">{title(payment.paymentMethod)} · {date(payment.paymentDate)}</p><p className="font-mono text-[11px] text-slate-500">{payment.receiptNumber ?? payment.reference ?? "No reference"}</p>{payment.proofUrl ? <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary-700 hover:underline">View proof</a> : null}</td>
      <td className="px-4 py-4"><p>{formatCurrency(payment.totalPaid, payment.currency)} paid</p><p className="text-xs text-slate-500">{formatCurrency(payment.remainingAmount, payment.currency)} remaining</p><Badge variant={feeVariant(payment.feeStatus)}>{title(payment.feeStatus)}</Badge></td>
      <td className="px-4 py-4"><Badge variant={statusVariant(payment.status)}>{title(payment.status)}</Badge>{payment.isRefund ? <p className="mt-1 text-xs text-slate-500">Refund record</p> : null}{payment.refundReason ? <p className="mt-1 max-w-44 text-xs text-slate-500">{payment.refundReason}</p> : null}</td>
      <td className="px-4 py-4 text-slate-600">{date(payment.lastPaymentDate)}</td>
      <td className="px-4 py-4 text-xs text-slate-500"><p>Added by {payment.recordedBy}</p>{payment.verifiedBy ? <p>Verified by {payment.verifiedBy}</p> : null}</td>
      <td className="px-4 py-4"><div className="space-y-2">{payment.receiptNumber && !payment.isLegacy ? <a href={`/api/payments/${payment.id}/receipt`} className="text-xs font-semibold text-primary-700 hover:underline">Download receipt PDF</a> : null}{payment.isLegacy ? <p className="text-xs text-slate-500">Historical record</p> : <PaymentActions paymentId={payment.id} status={payment.status} amount={payment.amount} canRefund={!payment.isRefund} />}</div></td>
    </tr>)}</tbody></table></div>}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500"><span>{result.total} transaction{result.total === 1 ? "" : "s"}</span><div className="flex gap-3">{page > 1 ? <Link href={pageHref(raw, page - 1)}>Previous</Link> : null}<span>Page {page} of {result.totalPages}</span>{page < result.totalPages ? <Link href={pageHref(raw, page + 1)}>Next</Link> : null}</div></div>
    </Card>
  </div></OfficeShell>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) { return <Card><CardContent className="p-4"><p className="flex items-center gap-1.5 text-xs text-slate-500"><Icon className="h-4 w-4 text-primary-600" />{label}</p><p className="mt-1 text-lg font-bold text-slate-900">{value}</p></CardContent></Card>; }
function Filter({ label, name, value, options }: { label: string; name: string; value: string; options: [string,string][] }) { return <label><span className={labelClass}>{label}</span><select name={name} defaultValue={value} className={controlClass}>{options.map(([key,text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
const labelClass = "mb-1 flex items-center gap-1 text-xs font-medium text-slate-600";
const controlClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-500";
function str(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
function enumValue<T extends string>(value: string, allowed: T[]): T | "ALL" { return allowed.includes(value as T) ? value as T : "ALL"; }
function title(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
function date(value: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "—"; }
function statusVariant(status: string): "success" | "warning" | "danger" | "neutral" { return status === "verified" ? "success" : status === "pending" ? "warning" : status === "cancelled" ? "danger" : "neutral"; }
function feeVariant(status: string): "success" | "warning" | "danger" | "neutral" { return status === "paid" ? "success" : status === "partially_paid" || status === "pending_verification" ? "warning" : status === "cancelled" ? "danger" : "neutral"; }
function pageHref(raw: Record<string, string | string[] | undefined>, page: number) { const params = new URLSearchParams(); for (const [key,value] of Object.entries(raw)) if (key !== "page" && typeof value === "string" && value) params.set(key,value); if (page > 1) params.set("page",String(page)); return `/office/payments?${params.toString()}`; }
