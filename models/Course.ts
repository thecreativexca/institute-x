import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  COURSE_LEVELS,
  COURSE_STATUSES,
  type CourseLevel,
  type CourseStatus,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Category } from "./Category";

/**
 * Course â€” a single purchasable/learnable course.
 *
 * The catalog currently defines 16 courses across 5 categories; this schema
 * supports all of them without hardcoding any count anywhere.
 * Admins will control public visibility/bundling via `isDisplayed` and
 * `isBundleable` from the office portal (later phase).
 */

/**
 * Course completion rules (Phase 11 completion rule engine).
 *
 * Every course that requires an explicit completion check carries its own
 * criteria — courses are NOT assumed to share one policy. Defaults below are
 * intentionally conservative:
 *
 *   - `requireAllLessons`        true  — all published lessons must be completed
 *   - `requireAssignments`       false — assignments are NOT required unless an
 *                                        admin explicitly enables them
 *   - `requireAllAssignments`    true  — when required, every published
 *                                        assignment must be submitted
 *   - `requireQuizzes`           false — quizzes are NOT required by default
 *   - `requireQuizPass`          true  — when required, the best submitted
 *                                        attempt must pass
 *   - `requireFinalTest`         false — final assessment not required by default
 *   - `finalTestPassingPercentage` null — overrides the quiz's own
 *                                        `passingPercentage` when set
 *
 * If a course document has no `completionCriteria` (e.g. created before
 * Phase 11), the services treat it as the default object above.
 */
export interface ICompletionCriteria {
  requireAllLessons: boolean;
  requireAssignments: boolean;
  requireAllAssignments: boolean;
  requireQuizzes: boolean;
  requireQuizPass: boolean;
  requireFinalTest: boolean;
  finalTestPassingPercentage: number | null;
}

export interface ICourseFaq {
  question: string;
  answer: string;
  enabled: boolean;
}

export type LearningMode = "online" | "hybrid" | "offline";

export const LEARNING_MODES = {
  ONLINE: "online",
  HYBRID: "hybrid",
  OFFLINE: "offline",
} as const;

export interface ICourse {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  category: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  level: CourseLevel;
  status: CourseStatus;
  durationWeeks?: number;
  price?: number;
  compareAtPrice?: number;
  currency: string;
  isFree: boolean;
  isPurchasable: boolean;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  learningMode: LearningMode;
  tags: string[];
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string[];
  faqs: ICourseFaq[];
  instructorName?: string;
  seoTitle?: string;
  seoDescription?: string;
  /** Office staff who created / last updated this course (internal only). */
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  /** Show on the public website (admin-controlled). */
  isDisplayed: boolean;
  /** May be included in bundles/packages (future phase). */
  isBundleable: boolean;
  sortOrder: number;
  /** Completion rule configuration (see ICompletionCriteria). */
  completionCriteria?: ICompletionCriteria;
}

const FaqSchema = new Schema<ICourseFaq>(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const CompletionCriteriaSchema = new Schema<ICompletionCriteria>(
  {
    requireAllLessons: { type: Boolean, default: true },
    requireAssignments: { type: Boolean, default: false },
    requireAllAssignments: { type: Boolean, default: true },
    requireQuizzes: { type: Boolean, default: false },
    requireQuizPass: { type: Boolean, default: true },
    requireFinalTest: { type: Boolean, default: false },
    finalTestPassingPercentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: Category.modelName,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 300 },
    description: { type: String, trim: true },
    level: {
      type: String,
      enum: Object.values(COURSE_LEVELS),
      default: COURSE_LEVELS.BEGINNER,
    },
    status: {
      type: String,
      enum: Object.values(COURSE_STATUSES),
      default: COURSE_STATUSES.DRAFT,
      index: true,
    },
    durationWeeks: { type: Number, min: 1 },
    price: { type: Number, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
    isFree: { type: Boolean, default: false },
    isPurchasable: { type: Boolean, default: true },
    thumbnailUrl: { type: String },
    thumbnailPublicId: { type: String },
    learningMode: {
      type: String,
      enum: Object.values(LEARNING_MODES),
      default: LEARNING_MODES.ONLINE,
    },
    tags: { type: [String], default: [] },
    learningOutcomes: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    targetAudience: { type: [String], default: [] },
    faqs: { type: [FaqSchema], default: [] },
    instructorName: { type: String, trim: true, maxlength: 120 },
    seoTitle: { type: String, trim: true, maxlength: 200 },
    seoDescription: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDisplayed: { type: Boolean, default: true },
    isBundleable: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    completionCriteria: { type: CompletionCriteriaSchema, default: undefined },
  },
  { timestamps: true }
);

CourseSchema.index({ status: 1, isDisplayed: 1 });
CourseSchema.index({ category: 1, sortOrder: 1 });
CourseSchema.index({ updatedAt: -1 });
CourseSchema.index({ tags: 1 });

export const Course = defineModel("Course", CourseSchema);
