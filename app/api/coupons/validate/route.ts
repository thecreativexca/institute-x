import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStudentApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { validateCouponForCheckout } from "@/lib/payments/coupons";
import { Course } from "@/models/Course";

const schema = z.object({ code: z.string().trim().min(1).max(40), courseId: z.string().trim().min(1) });

export async function POST(request: Request) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Enter a coupon code." }, { status: 400 });
    await connectDB();
    const course = await Course.findOne({ _id: parsed.data.courseId, status: "published" }).select("price isFree").lean();
    if (!course || course.isFree) return NextResponse.json({ success: false, error: "Coupon cannot be applied to this course." }, { status: 400 });
    const quote = await validateCouponForCheckout({ code: parsed.data.code, studentId: user.id, courseId: parsed.data.courseId, amount: course.price ?? 0 });
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to validate coupon." }, { status: 400 });
  }
}
