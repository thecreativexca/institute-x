import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  ENROLLMENT_STATUSES,
  FEE_STATUSES,
  ENROLLMENT_SOURCES,
  ENROLLMENT_ACCESS_TYPES,
  type EnrollmentStatus,
  type FeeStatus,
  type EnrollmentSource,
  type EnrollmentAccessType,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { User } from "./User";

/**
 * Enrollment â€” links a student to a course.
 * Course access and fee status are deliberately independent. Office staff can
 * manage access without silently rewriting financial history.
 */
export interface IEnrollment {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course: Types.ObjectId;
  order?: Types.ObjectId | null;
  source: EnrollmentSource;
  accessType: EnrollmentAccessType;
  status: EnrollmentStatus;
  paymentStatus: FeeStatus;
  enrolledAt: Date;
  completedAt?: Date | null;
  expiresAt?: Date | null;
  notes?: string;
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
    order: { type: Schema.Types.ObjectId, ref: "Payment", default: null, index: true },
    source: {
      type: String,
      enum: Object.values(ENROLLMENT_SOURCES),
      default: ENROLLMENT_SOURCES.ADMIN_MANUAL,
      index: true,
    },
    accessType: {
      type: String,
      enum: Object.values(ENROLLMENT_ACCESS_TYPES),
      default: ENROLLMENT_ACCESS_TYPES.LIFETIME,
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUSES),
      default: ENROLLMENT_STATUSES.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(FEE_STATUSES),
      default: FEE_STATUSES.UNPAID,
    },
    enrolledAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// A student can be enrolled in a given course only once.
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
EnrollmentSchema.index({ status: 1, enrolledAt: -1 });
EnrollmentSchema.index({ source: 1, enrolledAt: -1 });

export const Enrollment = defineModel("Enrollment", EnrollmentSchema);
