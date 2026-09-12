"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/payments/razorpay";

interface SuccessClientProps {
  payment: {
    _id: string;
    amount: number;
    currency: string;
    receiptNumber: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    paidAt?: Date | string | null;
    course: {
      _id: string;
      name: string;
      slug: string;
      thumbnailUrl?: string;
    };
    enrollment?: {
      status: string;
    };
  };
}

export function SuccessClient({ payment }: SuccessClientProps) {
  const amount = payment.amount;
  const currency = payment.currency;
  const course = payment.course;

  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16 lg:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-10 w-10 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-600">Your enrollment has been confirmed. Welcome to the course!</p>
        </div>

        {/* Course Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex gap-4">
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt=""
                className="h-24 w-32 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900 truncate">{course.name}</h2>
              <p className="text-sm text-slate-500 mt-1">
                Amount paid: <strong>{formatCurrency(amount, currency)}</strong>
              </p>
              <p className="text-sm text-slate-500">
                Receipt: <span className="font-mono">{payment.receiptNumber}</span>
              </p>
              {payment.razorpayPaymentId && (
                <p className="text-sm text-slate-500">
                  Payment ID: <span className="font-mono">{payment.razorpayPaymentId}</span>
                </p>
              )}
              {payment.paidAt && (
                <p className="text-sm text-slate-500">
                  Date: {new Date(payment.paidAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enrollment Status */}
        {payment.enrollment && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-amber-950">Enrollment Active</p>
                <p className="text-sm text-amber-800">You now have full access to all course materials.</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/student/courses/${course.slug}`}
            className="block w-full rounded-xl bg-primary-600 px-6 py-4 text-center text-lg font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Start Learning
          </Link>
          <Link
            href="/student/dashboard"
            className="block w-full rounded-xl border border-slate-300 bg-white px-6 py-4 text-center text-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href={`/student/payments/${payment._id}`}
            className="block w-full text-center text-sm text-primary-600 hover:underline"
          >
            View Receipt
          </Link>
        </div>

        {/* Receipt Download */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Payment Receipt</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">Receipt Number</dt>
              <dd className="font-mono font-medium text-slate-900">{payment.receiptNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Course</dt>
              <dd className="font-medium text-slate-900">{course.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(amount, currency)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium text-slate-900">
                {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-IN") : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Payment Method</dt>
              <dd className="font-medium text-slate-900">Razorpay</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-amber-800">Paid</dd>
            </div>
          </dl>
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              This is a payment receipt, not a tax invoice. For GST invoices, please contact the institute.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}