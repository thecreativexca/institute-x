import type { PaymentProvider, PaymentStatus } from "@/lib/constants";

/**
 * Safe DTOs for the office Payments & Orders area. Mongoose documents and
 * Cloudinary/Razorpay internals are never passed to client components raw.
 * All amounts are stored in PAISE (see lib/payments/razorpay.ts).
 */

export interface OfficePaymentRow {
  id: string;
  receiptNumber: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  /** Amount in paise. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  enrollmentStatus?: string;
  paidAt: string | null;
  createdAt: string;
  failureDescription?: string;
}

export interface OfficePaymentsSummary {
  totalCount: number;
  paidCount: number;
  /** Sum of paid amounts in paise. */
  grossPaise: number;
  refundedCount: number;
  /** Sum of refunded amounts in paise. */
  refundedPaise: number;
  /** grossPaise minus refundedPaise. */
  netPaise: number;
  pendingCount: number;
  failedCount: number;
}

export interface OfficePaymentsResult {
  payments: OfficePaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: OfficePaymentsSummary;
}

export interface OfficePaymentFilters {
  status?: PaymentStatus | "ALL";
  /** Free-text against receipt / Razorpay order id / payment id. */
  search?: string;
  courseId?: string;
  from?: string;
  to?: string;
}

export interface CourseSelectOption {
  id: string;
  name: string;
}
