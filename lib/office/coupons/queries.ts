import "server-only";

import { PAYMENT_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { Coupon } from "@/models/Coupon";
import { Course } from "@/models/Course";
import { Payment } from "@/models/Payment";
import type { CouponCourseOption, CouponListItem } from "./dto";

export async function getCouponsAdminData(): Promise<{
  coupons: CouponListItem[];
  courses: CouponCourseOption[];
}> {
  await connectDB();
  const [docs, courseDocs, usage] = await Promise.all([
    Coupon.find({}).sort({ createdAt: -1 }).lean(),
    Course.find({ status: "published" }).select("name").sort({ name: 1 }).lean(),
    Payment.aggregate<{ _id: string; count: number }>([
      { $match: { status: PAYMENT_STATUSES.PAID, "metadata.couponCode": { $type: "string" } } },
      { $group: { _id: "$metadata.couponCode", count: { $sum: 1 } } },
    ]),
  ]);
  const used = new Map(usage.map((row) => [row._id, row.count]));
  return {
    coupons: docs.map((coupon) => ({
      id: coupon._id.toString(),
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minimumOrderValue: coupon.minimumOrderValue,
      maxDiscount: coupon.maxDiscount ?? null,
      startsAt: coupon.startsAt ? coupon.startsAt.toISOString().slice(0, 10) : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : "",
      usageLimit: coupon.usageLimit ?? null,
      perStudentUsageLimit: coupon.perStudentUsageLimit,
      applicableCourses: coupon.applicableCourses.map(String),
      isActive: coupon.isActive,
      usedCount: used.get(coupon.code) ?? 0,
      createdAt: coupon.createdAt.toISOString(),
    })),
    courses: courseDocs.map((course) => ({ id: course._id.toString(), name: course.name })),
  };
}
