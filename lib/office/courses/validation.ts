import { z } from "zod";

import { COURSE_LEVELS, COURSE_STATUSES, LEARNING_MODES, RESOURCE_ACCESS } from "@/lib/constants";
import { objectIdSchema, slugSchema } from "@/lib/validations/common";
import { parseYouTubeVideoId } from "./youtube";

/**
 * Phase 17 input validation. Server-side validation is authoritative;
 * client validation in the forms is UX only.
 */

const courseLevelEnum = z.enum([
  COURSE_LEVELS.BEGINNER,
  COURSE_LEVELS.INTERMEDIATE,
  COURSE_LEVELS.ADVANCED,
  COURSE_LEVELS.ALL_LEVELS,
]);

export const courseStatusEnum = z.enum([
  COURSE_STATUSES.DRAFT,
  COURSE_STATUSES.PUBLISHED,
  COURSE_STATUSES.ARCHIVED,
]);

const learningModeEnum = z.enum([
  LEARNING_MODES.ONLINE,
  LEARNING_MODES.HYBRID,
  LEARNING_MODES.OFFLINE,
]);

const nonEmpty = (max: number) => z.string().trim().min(1).max(max);

const stringListSchema = z
  .array(z.string().trim().min(1).max(200))
  .max(20, "Please keep the list to 20 items or fewer")
  .default([]);

const tagsSchema = z
  .array(z.string().trim().min(1).max(30))
  .max(15, "Please keep tags to 15 or fewer")
  .default([]);

const faqSchema = z.object({
  question: nonEmpty(300),
  answer: nonEmpty(2000),
  enabled: z.boolean().default(true),
});

/* -------------------------------- Slug ----------------------------------- */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ------------------------------ Course form ------------------------------- */

/**
 * Fields allowlisted for course create/update (req. 102 mass assignment).
 * Internal counters, enrollment data, createdBy and foreign keys are NEVER
 * accepted from the client.
 */
export const courseFormSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(150),
  slug: slugSchema,
  categoryId: objectIdSchema,
  shortDescription: z.string().trim().max(300).default(""),
  description: z.string().trim().max(20000).default(""),
  level: courseLevelEnum.default(COURSE_LEVELS.BEGINNER),
  learningMode: learningModeEnum.default(LEARNING_MODES.ONLINE),
  durationWeeks: z.coerce.number().int().min(1).max(104).optional(),
  isFree: z.boolean().default(false),
  isPurchasable: z.boolean().default(true),
  price: z.coerce.number().min(0, "Price cannot be negative").max(10_000_000).default(0),
  compareAtPrice: z.coerce.number().min(0).max(10_000_000).optional(),
  instructorName: z.string().trim().max(120).default(""),
  tags: tagsSchema,
  learningOutcomes: stringListSchema,
  requirements: stringListSchema,
  targetAudience: stringListSchema,
  faqs: z.array(faqSchema).max(20).default([]),
  seoTitle: z.string().trim().max(200).default(""),
  seoDescription: z.string().trim().max(300).default(""),
});

export type CourseFormInput = z.infer<typeof courseFormSchema>;

/** Extra validation that depends on multiple fields (req. 27). */
export function validateCoursePricing(data: {
  isFree: boolean;
  price: number;
  compareAtPrice?: number;
}): string | null {
  if (!data.isFree && data.price <= 0) {
    return "Paid courses need a price greater than zero, or mark the course as free.";
  }
  if (data.isFree) {
    return null;
  }
  if (
    data.compareAtPrice !== undefined &&
    data.compareAtPrice > 0 &&
    data.price > 0 &&
    data.compareAtPrice <= data.price
  ) {
    return "Compare-at price should be higher than the selling price.";
  }
  return null;
}

/* -------------------------------- Modules --------------------------------- */

export const createModuleSchema = z.object({
  courseId: objectIdSchema,
  title: nonEmpty(150),
  description: z.string().trim().max(500).default(""),
  isPublished: z.boolean().default(false),
});

export const updateModuleSchema = z.object({
  title: nonEmpty(150).optional(),
  description: z.string().trim().max(500).optional(),
  isPublished: z.boolean().optional(),
});

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
});

/* -------------------------------- Lessons --------------------------------- */

const youtubeOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => {
      if (!value) return true;
      return parseYouTubeVideoId(value) !== null;
    },
    { message: "Please enter a valid YouTube URL (youtube.com/watch, youtu.be or embed)." }
  );

export const createLessonSchema = z.object({
  moduleId: objectIdSchema,
  title: nonEmpty(200),
  description: z.string().trim().max(20000).default(""),
  youtubeUrl: youtubeOrEmpty.default(""),
  durationMinutes: z.coerce.number().int().min(0).max(600).optional(),
  isPreview: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export const updateLessonSchema = z.object({
  title: nonEmpty(200).optional(),
  description: z.string().trim().max(20000).optional(),
  youtubeUrl: youtubeOrEmpty.optional(),
  durationMinutes: z.coerce.number().int().min(0).max(600).optional(),
  isPreview: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

/* ------------------------------- Resources -------------------------------- */

export const resourceAccessEnum = z.enum([
  RESOURCE_ACCESS.VIEW_AND_DOWNLOAD,
  RESOURCE_ACCESS.VIEW_ONLY,
  RESOURCE_ACCESS.PRIVATE,
]);
