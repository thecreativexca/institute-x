import "server-only";

import { Types } from "mongoose";

import { PAYMENT_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Coupon } from "@/models/Coupon";
import { Payment } from "@/models/Payment";

export interface CouponQuote {
  code: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export async function validateCouponForCheckout(params: {
  code: string;
  studentId: string;
  courseId: string;
  amount: number;
}): Promise<CouponQuote> {
  await connectDB();
  const code = params.code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code, isActive: true }).lean();
  if (!coupon) throw new Error("Coupon is invalid or inactive.");
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new Error("This coupon is not active yet.");
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("This coupon has expired.");
  if (params.amount < coupon.minimumOrderValue) throw new Error(`Minimum order value is ₹${coupon.minimumOrderValue}.`);
  if (coupon.applicableCourses.length && !coupon.applicableCourses.some((id) => id.equals(new Types.ObjectId(params.courseId)))) throw new Error("This coupon does not apply to the selected course.");
  const paidQuery = { status: PAYMENT_STATUSES.PAID, "metadata.couponCode": code };
  const [totalUses, studentUses] = await Promise.all([
    Payment.countDocuments(paidQuery),
    Payment.countDocuments({ ...paidQuery, student: new Types.ObjectId(params.studentId) }),
  ]);
  if (coupon.usageLimit && totalUses >= coupon.usageLimit) throw new Error("This coupon has reached its usage limit.");
  if (studentUses >= coupon.perStudentUsageLimit) throw new Error("You have already used this coupon.");
  let discount = coupon.type === "percentage" ? (params.amount * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(params.amount, Math.max(0, discount));
  discount = Math.round(discount * 100) / 100;
  const finalAmount = Math.max(0, params.amount - discount);
  if (finalAmount < 1) {
    throw new Error("This coupon would reduce the payable amount below the payment gateway minimum.");
  }
  return { code, originalAmount: params.amount, discountAmount: discount, finalAmount };
}
