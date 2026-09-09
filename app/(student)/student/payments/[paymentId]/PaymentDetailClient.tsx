"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { formatCurrency } from "@/lib/payments/razorpay";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  receiptNumber: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paidAt?: Date | string | null;
  createdAt: Date | string;
  course?: {
    _id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
  };
  enrollment?: {
    status: string;
    _id: string;
  };
}

const statusLabels: Record<string, string> = {
  [PAYMENT_STATUSES.CREATED]: "Created",
  [PAYMENT_STATUSES.PENDING]: "Pending",
  [PAYMENT_STATUSES.PAID]: "Paid",
  [PAYMENT_STATUSES.FAILED]: "Failed",
  [PAYMENT_STATUSES.REFUNDED]: "Refunded",
};

const statusVariants: Record<string, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  [PAYMENT_STATUSES.CREATED]: "neutral",
  [PAYMENT_STATUSES.PENDING]: "warning",
  [PAYMENT_STATUSES.PAID]: "success",
  [PAYMENT_STATUSES.FAILED]: "danger",
  [PAYMENT_STATUSES.REFUNDED]: "primary",
};

interface PaymentDetailClientProps {
  payment: Payment;
}

export function PaymentDetailClient({ payment }: PaymentDetailClientProps) {
  const amount = payment.amount;
  const currency = payment.currency;
  const course = payment.course;
  const status = payment.status;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="student-page-header flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Details</h1>
            <p className="text-slate-600 mt-1">Receipt: {payment.receiptNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </Button>
          </div>
        </div>

        {/* Course Info */}
        {course && (
          <Card className="rounded-2xl border-primary-100 p-6">
            <div className="flex gap-4">
              {course.thumbnailUrl && (
                <img
                  src={course.thumbnailUrl}
                  alt=""
                  className="h-24 w-32 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-semibold text-slate-900 truncate">{course.name}</h2>
                  <Badge variant={statusVariants[status] || "default"}>
                    {statusLabels[status] || status}
                  </Badge>
                </div>
                <Link
                  href={`/student/courses/${course.slug}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Go to Course
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Receipt */}
        <Card className="overflow-hidden rounded-2xl border-primary-100 p-6 print-only:hidden">
          <div className="-mx-6 -mt-6 mb-6 border-b border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50 p-6 text-center">
            <h3 className="text-lg font-semibold text-slate-900">Payment Receipt</h3>
            <p className="text-sm text-slate-500">{siteConfig.name}</p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <dt className="text-slate-500">Receipt Number</dt>
              <dd className="font-mono font-medium text-slate-900">{payment.receiptNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Payment Date</dt>
              <dd className="font-medium text-slate-900">
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Course</dt>
              <dd className="font-medium text-slate-900">{course?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-semibold text-slate-900 text-lg">{formatCurrency(amount, currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Payment Method</dt>
              <dd className="font-medium text-slate-900">Razorpay</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-emerald-700">{statusLabels[status] || status}</dd>
            </div>
            {payment.razorpayPaymentId && (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Razorpay Payment ID</dt>
                <dd className="font-mono font-medium text-slate-900">{payment.razorpayPaymentId}</dd>
              </div>
            )}
            {payment.razorpayOrderId && (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Razorpay Order ID</dt>
                <dd className="font-mono font-medium text-slate-900">{payment.razorpayOrderId}</dd>
              </div>
            )}
          </dl>

          <div className="pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              This is a payment receipt, not a tax invoice. For GST invoices, please contact the institute.
            </p>
          </div>
        </Card>

        {/* Print-friendly receipt */}
        <div className="hidden print:block max-w-2xl mx-auto p-8 border border-slate-300 bg-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{siteConfig.name}</h2>
            <p className="text-slate-600">{siteConfig.tagline}</p>
          </div>
          <hr className="border-slate-300 mb-6" />
          <h3 className="text-lg font-semibold text-slate-900 text-center mb-6">Payment Receipt</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <dt className="text-slate-600">Receipt Number</dt>
              <dd className="font-mono font-medium text-slate-900">{payment.receiptNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Date</dt>
              <dd className="font-medium text-slate-900">
                {payment.paidAt
                  ? new Date(payment.paidAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-600">Course</dt>
              <dd className="font-medium text-slate-900">{course?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Amount</dt>
              <dd className="font-semibold text-slate-900 text-lg">{formatCurrency(amount, currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Payment Method</dt>
              <dd className="font-medium text-slate-900">Razorpay</dd>
            </div>
            <div>
              <dt className="text-slate-600">Status</dt>
              <dd className="font-medium text-slate-900">{statusLabels[status] || status}</dd>
            </div>
          </dl>
          <hr className="border-slate-300 my-6" />
          <p className="text-sm text-slate-600 text-center">
            This is a payment receipt, not a tax invoice. For GST invoices, please contact the institute.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/student/payments"
            className="flex-1 rounded-xl border border-primary-200 bg-white px-6 py-3 text-center font-medium text-primary-800 transition-colors hover:bg-primary-50"
          >
            Back to History
          </Link>
          {payment.enrollment && (
            <Link
              href={`/student/courses/${course?.slug}`}
              className="flex-1 text-center rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Go to Course
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
