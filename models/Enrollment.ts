import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  ENROLLMENT_STATUSES,
  PAYMENT_STATUSES,
  type EnrollmentStatus,
  type PaymentStatus,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { User } from "./User";

/**
 * Enrollment â€” links a student to a course.
 * Payment capture (Razorpay) activates enrollments in a later phase via
 * `paymentStatus`; the lifecycle already supports it.
 */
export interface IEnrollment {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course: Types.ObjectId;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  enrolledAt: Date;
  completedAt?: Date | null;
  expiresAt?: Date | null;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUSES),
      default: ENROLLMENT_STATUSES.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
    },
    enrolledAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A student can be enrolled in a given course only once.
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = defineModel("Enrollment", EnrollmentSchema);
