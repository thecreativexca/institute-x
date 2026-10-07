import type { FeeStatus, PaymentMethod, PaymentStatus } from "@/lib/constants";

export interface OfficePaymentRow {
  id: string;
  receiptNumber: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseId: string;
  courseName: string;
  enrollmentId: string;
  totalFee: number;
  totalPaid: number;
  remainingAmount: number;
  feeStatus: FeeStatus;
  amount: number;
  currency: string;
  status: PaymentStatus | string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference: string | null;
  lastPaymentDate: string | null;
  recordedBy: string;
  verifiedBy: string | null;
  proofUrl: string | null;
  isRefund: boolean;
  originalPaymentId: string | null;
  refundReason: string | null;
  notes: string | null;
  isLegacy: boolean;
}

export interface OfficePaymentsSummary {
  todayCollected: number;
  monthCollected: number;
  totalCollected: number;
  pendingCount: number;
  outstandingAmount: number;
  paidStudents: number;
  partiallyPaidStudents: number;
  unpaidStudents: number;
  byMethod: Record<string, number>;
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
  paymentMethod?: PaymentMethod | "ALL";
  search?: string;
  courseId?: string;
  from?: string;
  to?: string;
}

export interface CourseSelectOption { id: string; name: string }

export interface PaymentEnrollmentOption {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  totalFee: number;
  totalPaid: number;
  remainingAmount: number;
  pendingAmount: number;
  recordableAmount: number;
  currency: string;
}
