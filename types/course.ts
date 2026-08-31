import type { CourseLevel, CourseStatus } from "@/lib/constants";
import type { BaseDocument } from "./common";

/** Re-export CourseStatus for use in other modules */
export type { CourseStatus };

/** Client-safe (serialized) category shape. */
export interface Category extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  /** Admin-controlled display ordering. */
  sortOrder: number;
}

/**
 * Client-safe (serialized) course shape.
 * The office portal will later control visibility/bundling via flags below.
 */
export interface Course extends BaseDocument {
  categoryId: string;
  categoryName?: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  level: CourseLevel;
  status: CourseStatus;
  durationWeeks?: number;
  price?: number;
  currency?: string;
  thumbnailUrl?: string;
  /** Show/hide on the public website (admin-controlled). */
  isDisplayed: boolean;
  /** Allow the course to appear inside bundles/packages (future phase). */
  isBundleable: boolean;
  /** Display order within its category. */
  sortOrder: number;
}

/** Lightweight shape for grids/cards — avoids shipping full descriptions. */
export interface CourseSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  categoryName?: string;
  level: CourseLevel;
  status: CourseStatus;
  thumbnailUrl?: string;
  /** Course duration in weeks */
  durationWeeks?: number;
  /** Course price in INR */
  price?: number;
  /** Currency code (default INR) */
  currency?: string;
  /** Whether this course is featured in popular sections */
  featured?: boolean;
}

/** Shape for catalog data (source of truth before DB) */
export interface CatalogCourseData {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  categoryName?: string;
  level: CourseLevel;
  status: CourseStatus;
  thumbnailUrl?: string;
  /** Course duration in weeks */
  durationWeeks?: number;
  /** Course price in INR */
  price?: number;
  /** Currency code (default INR) */
  currency?: string;
  /** Whether this course is featured in popular sections */
  featured?: boolean;
}
