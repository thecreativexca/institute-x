import { z } from "zod";

import { COURSE_LEVELS, COURSE_STATUSES } from "@/lib/constants";

import { objectIdSchema, slugSchema } from "./common";

/**
 * Foundation schemas for course management input.
 * Office-portal CRUD arrives in a later phase and will reuse these.
 *
 * Enum tuples are assembled from lib/constants so the values stay in sync.
 */

const courseLevelEnum = z.enum([
  COURSE_LEVELS.BEGINNER,
  COURSE_LEVELS.INTERMEDIATE,
  COURSE_LEVELS.ADVANCED,
  COURSE_LEVELS.ALL_LEVELS,
]);

const courseStatusEnum = z.enum([
  COURSE_STATUSES.DRAFT,
  COURSE_STATUSES.PUBLISHED,
  COURSE_STATUSES.ARCHIVED,
]);

export const createCourseSchema = z.object({
  categoryId: objectIdSchema,
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(150),
  slug: slugSchema,
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().optional(),
  level: courseLevelEnum.default(COURSE_LEVELS.BEGINNER),
  durationWeeks: z.number().int().min(1).max(104).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default("INR"),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  status: courseStatusEnum.optional(),
  isDisplayed: z.boolean().optional(),
  isBundleable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
