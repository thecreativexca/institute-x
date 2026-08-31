import { z } from "zod";

import { ACCOUNT_STATUSES, USER_ROLES } from "@/lib/constants";

import { emailSchema, indianPhoneSchema, passwordSchema } from "./common";

/**
 * Foundation schemas for user-related input.
 * Actual auth routes/actions are implemented in a later phase; these schemas
 * are the single source of truth they will validate against.
 */

export const registerStudentSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: emailSchema,
  phone: indianPhoneSchema.optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().min(24).max(24),
  status: z.enum([
    ACCOUNT_STATUSES.ACTIVE,
    ACCOUNT_STATUSES.INACTIVE,
    ACCOUNT_STATUSES.SUSPENDED,
  ]),
});

/** Role values allowed to be assigned (RBAC rules arrive in a later phase). */
export const assignableRolesSchema = z.enum([
  USER_ROLES.STUDENT,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.OFFICE_STAFF,
  USER_ROLES.CONTENT_MANAGER,
  USER_ROLES.FACULTY,
]);

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
