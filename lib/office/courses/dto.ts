import type { CourseStatus, CourseLevel, LearningMode } from "@/lib/constants";
import type { ICourseFaq } from "@/models/Course";

/**
 * Safe DTOs sent to office client components (req. 123). Mongoose documents,
 * internal ObjectIds metadata and Cloudinary internals are never passed raw.
 */

export type OfficeCourseStatus = CourseStatus;

export interface OfficeCourseSummary {
  id: string;
  name: string;
  slug: string;
  status: OfficeCourseStatus;
  categoryName: string;
  level: CourseLevel;
  isFree: boolean;
  price: number | null;
  currency: string;
  thumbnailUrl: string | null;
  moduleCount: number;
  lessonCount: number;
  publishedLessonCount: number;
  enrollmentCount: number;
  updatedAt: string;
}

export interface CourseListResult {
  courses: OfficeCourseSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OfficeCourseDetail {
  id: string;
  name: string;
  slug: string;
  status: OfficeCourseStatus;
  categoryId: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  level: CourseLevel;
  learningMode: LearningMode;
  durationWeeks: number | null;
  isFree: boolean;
  isPurchasable: boolean;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  thumbnailUrl: string | null;
  instructorName: string;
  tags: string[];
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string[];
  faqs: ICourseFaq[];
  seoTitle: string;
  seoDescription: string;
  isDisplayed: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  counts: CourseCounts;
}

export interface CourseCounts {
  modules: number;
  lessons: number;
  publishedLessons: number;
  draftLessons: number;
  resources: number;
  enrollments: number;
}

export interface ResourceDTO {
  id: string;
  title: string;
  description: string;
  type: string;
  access: string;
  isPublished: boolean;
  fileSize: number;
  originalFileName: string;
  fileUrl: string;
  sortOrder: number;
}

export interface CurriculumLessonDTO {
  id: string;
  title: string;
  description: string;
  videoUrl: string | null;
  videoId: string | null;
  durationMinutes: number | null;
  isPublished: boolean;
  isPreview: boolean;
  sortOrder: number;
  resourceCount: number;
  resources: ResourceDTO[];
}

export interface CurriculumModuleDTO {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  sortOrder: number;
  lessons: CurriculumLessonDTO[];
}

export interface CurriculumData {
  course: {
    id: string;
    name: string;
    slug: string;
    status: OfficeCourseStatus;
  };
  modules: CurriculumModuleDTO[];
  counts: {
    modules: number;
    lessons: number;
    publishedLessons: number;
    draftLessons: number;
    resources: number;
  };
}

export interface CategoryOption {
  id: string;
  name: string;
}

/** Result of the "add category" inline action on the course form. */
export interface CategoryCreateResult {
  ok: boolean;
  /** Present when a category was created (or already existed and was reused). */
  category?: CategoryOption;
  /** True when an existing category with the same name was reused instead of creating a duplicate. */
  reused?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface CourseFormValues {
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  level: CourseLevel;
  learningMode: LearningMode;
  durationWeeks: string;
  isFree: boolean;
  isPurchasable: boolean;
  price: string;
  compareAtPrice: string;
  instructorName: string;
  tags: string;
  learningOutcomes: string;
  requirements: string;
  targetAudience: string;
  faqs: Array<{ question: string; answer: string; enabled: boolean }>;
  seoTitle: string;
  seoDescription: string;
}

export interface PublishReadiness {
  ready: boolean;
  blockingIssues: string[];
  warnings: string[];
  setup: {
    basicInfo: boolean;
    thumbnail: boolean;
    curriculum: boolean;
    publishedLesson: boolean;
    pricing: boolean;
  };
}
