"use client";

import Link from "next/link";

interface FailureClientProps {
  student: {
    id: string;
    name: string;
    email: string;
  } | null;
  courseId?: string;
  error?: string;
}

export function FailureClient({ student, courseId, error }: FailureClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16 lg:py-20">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Unsuccessful</h1>
          <p className="text-slate-600">
            We couldn&apos;t complete your payment. Please try again or contact support if the issue persists.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="space-y-3">
          {courseId && (
            <Link
              href={`/checkout/${courseId}`}
              className="block w-full rounded-xl bg-primary-600 px-6 py-4 text-center text-lg font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Try Again
            </Link>
          )}
          {courseId && (
            <Link
              href={`/courses/${courseId}`}
              className="block w-full rounded-xl border border-slate-300 bg-white px-6 py-4 text-center text-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back to Course
            </Link>
          )}
          <Link
            href="/student/dashboard"
            className="block w-full rounded-xl border border-slate-300 bg-white px-6 py-4 text-center text-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/contact"
            className="block w-full text-center text-sm text-primary-600 hover:underline"
          >
            Contact Support
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Common Issues</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Check your internet connection and try again
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Ensure sufficient balance/limit on your payment method
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Verify card/UPI details are correct
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Try a different payment method (card, UPI, net banking, wallet)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}