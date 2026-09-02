import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { LESSON_CONTENT_TYPES, type LessonContentType } from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Module } from "./Module";

/**
 * Lesson â€” the smallest learning unit inside a module.
 *
 * A lesson carries one of three content types:
 *   - text  -> `content` (rich text / markdown)
 *   - video -> `videoProvider: "youtube"` + `videoUrl`
 *   - pdf   -> `pdfUrl` (+ `pdfPublicId` for the Cloudinary asset)
 */
export type { LessonContentType };

export interface ILesson {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  course: Types.ObjectId;
  module: Types.ObjectId;
  title: string;
  contentType: LessonContentType;
  /** Rich text/markdown body for text lessons. */
  content?: string;
  /** Provider-agnostic video reference for YouTube embeds. */
  videoProvider?: "youtube";
  videoUrl?: string;
  /** PDF document content (uploaded by admin via Cloudinary). */
  pdfUrl?: string;
  pdfPublicId?: string;
  durationMinutes?: number;
  /** Free preview lesson on the public site. */
  isPreview: boolean;
  /**
   * Published lessons are the only lessons that count towards progress and are
   * listed in the student curriculum. Default `true` preserves all pre-Phase-11
   * lessons; the Office Portal can create drafts by explicitly passing `false`.
   */
  isPublished: boolean;
  sortOrder: number;
}

const LessonSchema = new Schema<ILesson>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: Module.modelName,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    contentType: {
      type: String,
      enum: Object.values(LESSON_CONTENT_TYPES),
      default: LESSON_CONTENT_TYPES.VIDEO,
    },
    content: { type: String },
    videoProvider: { type: String, enum: ["youtube"] },
    videoUrl: { type: String },
    pdfUrl: { type: String },
    pdfPublicId: { type: String },
    durationMinutes: { type: Number, min: 0 },
    isPreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LessonSchema.index({ module: 1, sortOrder: 1 });

export const Lesson = defineModel("Lesson", LessonSchema);
