export interface CouponFormInput {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumOrderValue: number;
  maxDiscount?: number | null;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number | null;
  perStudentUsageLimit: number;
  applicableCourses: string[];
  isActive: boolean;
}

export interface CouponListItem extends CouponFormInput {
  id: string;
  usedCount: number;
  createdAt: string;
}

export interface CouponCourseOption { id: string; name: string }

export interface CouponActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}
