import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name too long").optional(),
  phone: z.string().max(20, "Phone number too long").optional(),
  email: z.string().email("Invalid email address").optional(),
});

export const studentStatusSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  status: z.enum(["active", "inactive", "suspended"]),
  reason: z.string().max(500, "Reason too long").optional(),
});

export const manualEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  source: z.enum(["ONLINE_PAYMENT", "FREE", "MANUAL", "ADMIN_GRANTED"]),
  reason: z.string().max(500, "Reason too long").optional(),
  enrolledBy: z.string().min(1, "Actor ID is required"),
});

export const studentFiltersSchema = z.object({
  search: z.string().max(200).optional(),
    status: z.enum(["active", "inactive", "suspended", "ALL"]).optional(),
  emailVerified: z.enum(["verified", "unverified", "ALL"]).optional(),
  hasEnrollment: z.enum(["true", "false"]).optional(),
  courseId: z.string().optional(),
  joinedFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
  joinedTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["createdAt", "name", "lastLoginAt", "enrollmentCount"]).optional(),
  direction: z.enum(["asc", "desc"]).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type StudentStatusInput = z.infer<typeof studentStatusSchema>;
export type ManualEnrollmentInput = z.infer<typeof manualEnrollmentSchema>;
export type StudentFiltersInput = z.infer<typeof studentFiltersSchema>;