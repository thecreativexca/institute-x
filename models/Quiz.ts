import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { QUIZ_TYPES, type QuizType } from "@/lib/constants";
import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Module } from "./Module";
import { Lesson } from "./Lesson";

/**
 * Quiz â€” a test the student can take (Phase 10 quiz engine).
 *
 * Multiple quiz "types" are supported:
 *   - MODULE  â†’ associated with a module (module quiz)
 *   - LESSON  â†’ associated with a specific lesson (optional lesson quiz)
 *   - FINAL   â†’ final assessment for a whole course (optional)
 *
 * Questions live in the separate Question model so the full question set can
 * be referenced by QuizAttempt without bloating the Quiz document.
 */
export interface IQuiz {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  course: Types.ObjectId;
  /** Present when type === MODULE (or the module a lesson quiz belongs to). */
  module?: Types.ObjectId | null;
  /** Present when type === LESSON. */
  lesson?: Types.ObjectId | null;
  title: string;
  description?: string;
  instructions?: string;
  type: QuizType;
  /** Time limit in minutes. null/undefined means no time limit. */
  durationMinutes?: number | null;
  /** Minimum percentage required to pass. */
  passingPercentage: number;
  /** Cached sum of the marks of published questions. Re-synced by the engine. */
  totalMarks: number;
  /** Maximum allowed submitted attempts. null/undefined means unlimited. */
  maxAttempts?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  /** Whether correct answers/explanations may be shown on the result page. */
  showCorrectAnswers: boolean;
  isPublished: boolean;
  /** Optional availability window. Both are optional (null = no bound). */
  availableFrom?: Date | null;
  availableUntil?: Date | null;
}

const QuizSchema = new Schema<IQuiz>(
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
    description: { type: String, trim: true, maxlength: 1000 },
    instructions: { type: String, trim: true, maxlength: 4000 },
    type: {
      type: String,
      enum: Object.values(QUIZ_TYPES),
      default: QUIZ_TYPES.MODULE,
      index: true,
    },
    durationMinutes: { type: Number, min: 1, default: null },
    passingPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 40,
    },
    totalMarks: { type: Number, required: true, min: 0, default: 0 },
    maxAttempts: { type: Number, min: 1, default: null },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false, index: true },
    availableFrom: { type: Date, default: null },
    availableUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

QuizSchema.index({ course: 1, isPublished: 1, type: 1 });
QuizSchema.index({ module: 1, isPublished: 1 });
QuizSchema.index({ lesson: 1, isPublished: 1 });
QuizSchema.index({ isPublished: 1, availableFrom: 1, availableUntil: 1 });

export const Quiz = defineModel("Quiz", QuizSchema);
