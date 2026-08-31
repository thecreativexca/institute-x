import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Lesson } from "./Lesson";

/**
 * Assignment â€” foundational schema only.
 * Submission workflows, file uploads (Cloudinary) and grading arrive in
 * later phases; they extend this model and reference it.
 */
export interface IAssignment {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  course: Types.ObjectId;
  /** Optional parent module; assignments may attach at module level. */
  module?: Types.ObjectId | null;
  /** Optional parent lesson; assignments may also attach at module level later. */
  lesson?: Types.ObjectId | null;
  title: string;
  instructions: string;
  maxScore: number;
  dueAt?: Date | null;
  isPublished: boolean;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      default: null,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: Lesson.modelName,
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    instructions: { type: String, required: true },
    maxScore: { type: Number, required: true, min: 1 },
    dueAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Assignment = defineModel("Assignment", AssignmentSchema);
