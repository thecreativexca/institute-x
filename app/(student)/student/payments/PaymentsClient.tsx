"use client";

import Link from "next/link";
import { ArrowUpRight, CreditCard, ReceiptText } from "lucide-react";

import { StudentPageHeader } from "@/components/student/student-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/payments/razorpay";

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

export function PaymentsClient({ payments }: { payments: Payment[] }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <StudentPageHeader
        title="Payment History"
        description="Review course purchases, payment status and downloadable receipt details."
        icon={<CreditCard className="h-6 w-6" aria-hidden="true" />}
        eyebrow="Billing & receipts"
        action={
          <Button asChild variant="outline">
            <Link href="/courses">Explore Courses <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        }
      />

      {payments.length === 0 ? (
        <Card className="rounded-2xl border-primary-100 py-8">
          <EmptyState
            icon={<ReceiptText className="h-12 w-12" aria-hidden="true" />}
            title="No payments yet"
            description="Your course purchases and receipts will appear here."
            action={
              <Button asChild>
                <Link href="/courses">Browse Courses</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const course = payment.course;
            return (
              <Link key={payment._id} href={`/student/payments/${payment._id}`} className="group block">
                <Card className="rounded-2xl border-primary-100 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {course?.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-accent-100">
                        <ReceiptText className="h-7 w-7 text-primary-600" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="truncate font-semibold text-slate-900">{course?.name || "Course payment"}</h2>
                        <Badge variant={statusVariants[payment.status] || "default"}>
                          {statusLabels[payment.status] || payment.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="font-mono">{payment.receiptNumber}</span>
                        <span>
                          {new Date(payment.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-primary-50 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
                      <p className="font-bold text-primary-900">{formatCurrency(payment.amount, payment.currency)}</p>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
                        View details <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
