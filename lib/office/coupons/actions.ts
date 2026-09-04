"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { recordAuditEvent } from "@/lib/audit/log";
import { getValidatedSession } from "@/lib/auth/helpers";
import { PAYMENT_STATUSES, PERMISSIONS } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { requirePermission } from "@/lib/office/courses/permissions";
import { Coupon } from "@/models/Coupon";
import { Course } from "@/models/Course";
import { Payment } from "@/models/Payment";
import type { CouponActionResult, CouponFormInput } from "./dto";

const schema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens or underscores."),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive("Enter a discount greater than zero."),
  minimumOrderValue: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().positive().nullable().optional(),
  startsAt: z.string().optional().default(""),
  expiresAt: z.string().optional().default(""),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  perStudentUsageLimit: z.coerce.number().int().positive(),
  applicableCourses: z.array(z.string().refine(Types.ObjectId.isValid)).default([]),
  isActive: z.boolean(),
}).superRefine((value, context) => {
  if (value.type === "percentage" && value.value > 100) context.addIssue({ code: "custom", path: ["value"], message: "Percentage cannot exceed 100." });
  if (value.startsAt && value.expiresAt && new Date(value.expiresAt) < new Date(value.startsAt)) context.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be after the start date." });
});

async function requireCouponAdmin() {
  const { user } = await getValidatedSession();
  return requirePermission(user, PERMISSIONS.PAYMENTS_MANAGE);
}

export async function saveCouponAction(id: string | null, input: CouponFormInput): Promise<CouponActionResult> {
  try {
    const user = await requireCouponAdmin();
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fields(parsed.error) };
    await connectDB();
    if (parsed.data.applicableCourses.length) {
      const count = await Course.countDocuments({ _id: { $in: parsed.data.applicableCourses }, status: "published" });
      if (count !== parsed.data.applicableCourses.length) return { ok: false, fieldErrors: { applicableCourses: "One or more selected courses are unavailable." } };
    }
    const code = parsed.data.code.toUpperCase();
    const duplicate = await Coupon.exists({ code, ...(id && Types.ObjectId.isValid(id) ? { _id: { $ne: id } } : {}) });
    if (duplicate) return { ok: false, fieldErrors: { code: "This coupon code already exists." } };
    const data = {
      ...parsed.data,
      code,
      startsAt: parsed.data.startsAt ? new Date(`${parsed.data.startsAt}T00:00:00`) : null,
      expiresAt: parsed.data.expiresAt ? new Date(`${parsed.data.expiresAt}T23:59:59.999`) : null,
      maxDiscount: parsed.data.type === "percentage" ? parsed.data.maxDiscount ?? null : null,
      usageLimit: parsed.data.usageLimit ?? null,
    };
    const coupon = id
      ? await Coupon.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      : await Coupon.create(data);
    if (!coupon) return { ok: false, error: "Coupon not found." };
    await recordAuditEvent({ actorUserId: user.id, actorRole: user.role, action: id ? "coupon.update" : "coupon.create", entityType: "coupon", entityId: coupon._id.toString(), metadata: { code } });
    revalidatePath("/office/coupons");
    return { ok: true, message: id ? "Coupon updated." : "Coupon created." };
  } catch (error) {
    console.error("Coupon save failed:", error);
    return { ok: false, error: "Unable to save the coupon." };
  }
}

export async function setCouponStatusAction(id: string, isActive: boolean): Promise<CouponActionResult> {
  try {
    const user = await requireCouponAdmin();
    if (!Types.ObjectId.isValid(id)) return { ok: false, error: "Invalid coupon." };
    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(id, { $set: { isActive } }, { new: true });
    if (!coupon) return { ok: false, error: "Coupon not found." };
    await recordAuditEvent({ actorUserId: user.id, actorRole: user.role, action: "coupon.update", entityType: "coupon", entityId: id, metadata: { isActive } });
    revalidatePath("/office/coupons");
    return { ok: true, message: isActive ? "Coupon activated." : "Coupon deactivated." };
  } catch (error) {
    console.error("Coupon status failed:", error);
    return { ok: false, error: "Unable to update the coupon." };
  }
}

export async function deleteCouponAction(id: string): Promise<CouponActionResult> {
  try {
    const user = await requireCouponAdmin();
    if (!Types.ObjectId.isValid(id)) return { ok: false, error: "Invalid coupon." };
    await connectDB();
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) return { ok: false, error: "Coupon not found." };
    const uses = await Payment.countDocuments({ status: PAYMENT_STATUSES.PAID, "metadata.couponCode": coupon.code });
    if (uses) return { ok: false, error: "Used coupons must be deactivated instead of deleted." };
    await Coupon.deleteOne({ _id: coupon._id });
    await recordAuditEvent({ actorUserId: user.id, actorRole: user.role, action: "coupon.delete", entityType: "coupon", entityId: id, metadata: { code: coupon.code } });
    revalidatePath("/office/coupons");
    return { ok: true, message: "Coupon deleted." };
  } catch (error) {
    console.error("Coupon delete failed:", error);
    return { ok: false, error: "Unable to delete the coupon." };
  }
}

function fields(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[issue.path.join(".") || "form"] ??= issue.message;
  return result;
}
