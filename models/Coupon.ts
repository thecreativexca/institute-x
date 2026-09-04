import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";

export interface ICoupon {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumOrderValue: number;
  maxDiscount?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  perStudentUsageLimit: number;
  applicableCourses: Types.ObjectId[];
  isActive: boolean;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minimumOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },
    usageLimit: { type: Number, default: null, min: 1 },
    perStudentUsageLimit: { type: Number, default: 1, min: 1 },
    applicableCourses: [{ type: Schema.Types.ObjectId, ref: Course.modelName }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CouponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });

export const Coupon = defineModel("Coupon", CouponSchema);
