import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { listOfficePayments, getOfficeCourseOptions } from "@/lib/office/payments/queries";
import type { OfficePaymentRow } from "@/lib/office/payments/dto";
import { formatCurrencyFromPaise, formatTimestamp } from "@/lib/analytics/format";
import { OfficeShell } from "@/components/office/OfficeShell";
import { RefundButton } from "@/components/office/payments/refund-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet, IndianRupee, RotateCcw, Hourglass, XCircle, Receipt, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Payments & Orders — Office Portal",
  description: "Track student payments, revenue and process refunds.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["created", "pending", "paid", "failed", "refunded", "ALL"] as const;
const PAGE_SIZE = 25;

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function asPage(value: unknown): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

interface PaymentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { user } = await getValidatedSession();
  const raw = await searchParams;
  if (!user) redirect("/office/login?callbackUrl=/office/payments");
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const canRead = hasPermission(user.role, PERMISSIONS.PAYMENTS_READ);
  const canRefund = hasPermission(user.role, PERMISSIONS.PAYMENTS_REFUND);

  if (!canRead) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardContent className="p-8 text-center text-sm text-slate-600">
            You do not have permission to view payments.
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const page = asPage(raw.page);
  const [result, courseOptions] = await Promise.all([
    listOfficePayments({
      session: user,
      filters: {
        status: asEnum(raw.status, VALID_STATUSES, "ALL"),
        search: str(raw.search).trim(),
        courseId: str(raw.course),
        from: str(raw.from) || undefined,
        to: str(raw.to) || undefined,
      },
      page,
      pageSize: PAGE_SIZE,
    }),
    getOfficeCourseOptions(),
  ]);

  const summary = result.summary;

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Finance</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Payments &amp; Orders</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Every order placed through the storefront, with revenue summaries and refunds.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiTile icon={IndianRupee} label="Gross collected" value={formatCurrencyFromPaise(summary.grossPaise)} sub={`${summary.paidCount} paid`} tone="text-emerald-700" />
          <KpiTile icon={Wallet} label="Net revenue" value={formatCurrencyFromPaise(summary.netPaise)} sub="after refunds" tone="text-primary-700" />
          <KpiTile icon={RotateCcw} label="Refunded" value={formatCurrencyFromPaise(summary.refundedPaise)} sub={`${summary.refundedCount} orders`} tone="text-slate-700" />
          <KpiTile icon={Hourglass} label="Pending" value={String(summary.pendingCount)} sub="created / pending" tone="text-accent-700" />
          <KpiTile icon={XCircle} label="Failed" value={String(summary.failedCount)} sub="declined orders" tone="text-red-700" />
        </div>

        <Card className="overflow-hidden border-slate-200/80">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60">
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form method="get" action="/office/payments" className="flex flex-wrap items-end gap-3">
              <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1"><Search className="h-3.5 w-3.5" aria-hidden="true" /> Search order</span>
                <input
                  type="search"
                  name="search"
                  defaultValue={str(raw.search)}
                  placeholder="Receipt or Razorpay order id…"
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>
              <label className="flex min-w-36 flex-col gap-1 text-xs font-medium text-slate-600">
                Status
                <select
                  name="status"
                  defaultValue={asEnum(raw.status, VALID_STATUSES, "ALL")}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500"
                >
                  {(["ALL", "paid", "refunded", "pending", "created", "failed"] as const).map((s) => (
                    <option key={s} value={s}>{s === "ALL" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                Course
                <select
                  name="course"
                  defaultValue={str(raw.course)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500"
                >
                  <option value="">All courses</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </label>
              <Button type="submit" variant="secondary" size="md">Apply filters</Button>
              {Object.keys(raw).some((key) => key !== "page" && str(raw[key])) ? (
                <Link href="/office/payments" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  Clear
                </Link>
              ) : null}
            </form>
          </CardContent>
        </Card>

        {result.payments.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<Receipt className="h-12 w-12" />}
                title="No orders found"
                description="No payments match these filters."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Course</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    {canRefund ? <th className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.payments.map((payment) => (
                    <PaymentRow key={payment.id} payment={payment} canRefund={canRefund} />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              totalItems={result.total}
              query={raw}
            />
          </div>
        )}
      </div>
    </OfficeShell>
  );
}

function PaymentRow({ payment, canRefund }: { payment: OfficePaymentRow; canRefund: boolean }) {
  const isFreeOrder = payment.provider === "free" && payment.amount === 0;
  const refundable = canRefund && payment.status === "paid" && payment.provider === "razorpay";

  return (
    <tr className="hover:bg-slate-50/70">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{payment.receiptNumber}</p>
        <p className="text-xs text-slate-400">{payment.provider.toUpperCase()}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{payment.studentName}</p>
        <p className="max-w-56 truncate text-xs text-slate-500">{payment.studentEmail}</p>
      </td>
      <td className="max-w-64 truncate px-4 py-3 text-slate-700">{payment.courseName}</td>
      <td className="px-4 py-3 text-right font-semibold text-slate-900">
        {isFreeOrder ? "Free" : formatCurrencyFromPaise(payment.amount, payment.currency)}
      </td>
      <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {formatTimestamp(payment.paidAt ?? payment.createdAt)}
      </td>
      {canRefund ? (
        <td className="px-4 py-3 text-right">
          {refundable ? (
            <RefundButton
              payment={{
                id: payment.id,
                receiptNumber: payment.receiptNumber,
                studentName: payment.studentName,
                courseName: payment.courseName,
                amount: payment.amount,
                currency: payment.currency,
              }}
            />
          ) : null}
        </td>
      ) : null}
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "paid" ? "success"
      : status === "refunded" ? "neutral"
        : status === "failed" ? "danger"
          : status === "pending" || status === "created" ? "warning"
            : "secondary";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={variant}>{label}</Badge>;
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80">
      <CardContent className="flex flex-col gap-1 p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
          {label}
        </p>
        <p className="truncate text-lg font-bold text-slate-900 sm:text-xl">{value}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  query,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  query: Record<string, string | string[] | undefined>;
}) {
  const keep = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page") continue;
    if (typeof value === "string" && value) keep.set(key, value);
  }
  const hrefFor = (page: number) => {
    const params = new URLSearchParams(keep.toString());
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/office/payments?${qs}` : "/office/payments";
  };

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-600">
      <p>{totalItems} order{totalItems !== 1 ? "s" : ""}</p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          <Link
            href={hrefFor(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200/70 disabled:pointer-events-none disabled:opacity-50"
            style={currentPage <= 1 ? { pointerEvents: "none", opacity: 0.5 } : undefined}
          >
            Previous
          </Link>
          <span className="px-1 text-slate-500">Page {currentPage} of {totalPages}</span>
          <Link
            href={hrefFor(currentPage + 1)}
            aria-disabled={currentPage >= totalPages}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200/70"
            style={currentPage >= totalPages ? { pointerEvents: "none", opacity: 0.5 } : undefined}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}
