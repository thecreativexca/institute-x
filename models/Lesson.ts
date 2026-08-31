import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Module } from "./Module";

/**
 * Lesson â€” the smallest learning unit inside a module.
 *
 * Foundational fields only. The video (YouTube embed), assignment and quiz
 * engines attach to lessons in later phases via `videoProvider`/`videoUrl`
 * and the Assignment/Quiz models referencing this collection.
 */
export type LessonContentType = "video" | "text";

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
  /** Provider-agnostic video reference for future YouTube embeds. */
  videoProvider?: "youtube";
  videoUrl?: string;
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
      enum: ["video", "text"],
      default: "video",
    },
    content: { type: String },
    videoProvider: { type: String, enum: ["youtube"] },
    videoUrl: { type: String },
    durationMinutes: { type: Number, min: 0 },
    isPreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LessonSchema.index({ module: 1, sortOrder: 1 });

export const Lesson = defineModel("Lesson", LessonSchema);
