import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  PAYMENT_STATUSES,
  PAYMENT_PROVIDERS,
  type PaymentStatus,
  type PaymentProvider,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Enrollment } from "./Enrollment";
import { User } from "./User";

export interface IPayment {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course: Types.ObjectId;
  enrollment?: Types.ObjectId;
  provider: PaymentProvider;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  receiptNumber: string;
  failureCode?: string;
  failureDescription?: string;
  paidAt?: Date | null;
  verifiedAt?: Date | null;
  metadata?: Record<string, unknown>;
}

const PaymentSchema = new Schema<IPayment>(
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
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: Enrollment.modelName,
      index: true,
    },
    provider: {
      type: String,
      enum: Object.values(PAYMENT_PROVIDERS),
      required: true,
      default: PAYMENT_PROVIDERS.RAZORPAY,
    },
    razorpayOrderId: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },
    razorpaySignature: { type: String, select: false },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.CREATED,
      index: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    failureCode: { type: String },
    failureDescription: { type: String },
    paidAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

PaymentSchema.index({ student: 1, course: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });

export const Payment = defineModel("Payment", PaymentSchema);