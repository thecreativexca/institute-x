import type { EnrollmentStatus, PaymentStatus, ProgressStatus } from "@/lib/constants";
import type { BaseDocument, MongoId } from "./common";

/** Client-safe (serialized) enrollment shape. */
export interface Enrollment extends BaseDocument {
  studentId: MongoId;
  courseId: MongoId;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  enrolledAt: string;
  completedAt?: string | null;
  expiresAt?: string | null;
}

/** Client-safe (serialized) per-lesson progress record. */
export interface Progress extends BaseDocument {
  studentId: MongoId;
  courseId: MongoId;
  lessonId: MongoId;
  status: ProgressStatus;
  completedAt?: string | null;
  lastViewedAt?: string | null;
}
