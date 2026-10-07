import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/constants";
import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Enrollment } from "./Enrollment";
import { User } from "./User";

export interface IPaymentProof {
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface IPayment {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course: Types.ObjectId;
  enrollment?: Types.ObjectId | null;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
  transactionReference?: string;
  chequeNumber?: string;
  chequeDate?: Date | null;
  bankName?: string;
  upiReference?: string;
  notes?: string;
  paymentProof?: IPaymentProof | null;
  status: PaymentStatus;
  receiptNumber?: string;
  recordedBy?: Types.ObjectId | null;
  verifiedBy?: Types.ObjectId | null;
  verifiedAt?: Date | null;
  originalPayment?: Types.ObjectId | null;
  refundReason?: string;
  isRefund?: boolean;
}

const PaymentProofSchema = new Schema<IPaymentProof>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const PaymentSchema = new Schema<IPayment>(
  {
    student: { type: Schema.Types.ObjectId, ref: User.modelName, required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: Course.modelName, required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: Enrollment.modelName, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true, default: "INR", uppercase: true, trim: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true,
      default: PAYMENT_METHODS.CASH,
      index: true,
    },
    paymentDate: { type: Date, required: true, default: () => new Date(), index: true },
    transactionReference: { type: String, trim: true, maxlength: 120 },
    chequeNumber: { type: String, trim: true, maxlength: 80 },
    chequeDate: { type: Date, default: null },
    bankName: { type: String, trim: true, maxlength: 120 },
    upiReference: { type: String, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 1000 },
    paymentProof: { type: PaymentProofSchema, default: null },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.PENDING,
      required: true,
      index: true,
    },
    receiptNumber: { type: String, unique: true, sparse: true, index: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: User.modelName, required: true, index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: User.modelName, default: null },
    verifiedAt: { type: Date, default: null },
    originalPayment: { type: Schema.Types.ObjectId, ref: "Payment", default: null, index: true },
    refundReason: { type: String, trim: true, maxlength: 500 },
    isRefund: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

PaymentSchema.index({ student: 1, course: 1, paymentDate: -1 });
PaymentSchema.index({ enrollment: 1, status: 1, paymentDate: -1 });
PaymentSchema.index({ status: 1, paymentMethod: 1, paymentDate: -1 });

export const Payment = defineModel("Payment", PaymentSchema);
