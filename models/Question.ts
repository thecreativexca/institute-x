import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Quiz } from "./Quiz";

/**
 * Question â€” a single MCQ that belongs to a Quiz.
 *
 * Options carry a stable string `id` (e.g. "a", "b", "c", "d") plus text.
 * The correct option id is stored server-side only and must NEVER be sent to
 * the browser before the student submits the attempt.
 */
export interface IQuestionOption {
  id: string;
  text: string;
}

export interface IQuestion {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  quiz: Types.ObjectId;
  question: string;
  options: IQuestionOption[];
  /** id of the correct option. Server-only secret until submission. */
  correctOptionId: string;
  marks: number;
  negativeMarks: number;
  explanation?: string;
  /** Display order within the quiz. */
  order: number;
  isPublished: boolean;
}

const QuestionOptionSchema = new Schema<IQuestionOption>(
  {
    id: { type: String, required: true, trim: true, maxlength: 20 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: Quiz.modelName,
      required: true,
      index: true,
    },
    question: { type: String, required: true, trim: true, maxlength: 2000 },
    options: {
      type: [QuestionOptionSchema],
      required: true,
      validate: [
        (v: IQuestionOption[]) => v.length >= 2,
        "At least two options are required",
      ],
    },
    correctOptionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    marks: { type: Number, required: true, min: 0, default: 1 },
    negativeMarks: { type: Number, required: true, min: 0, default: 0 },
    explanation: { type: String, trim: true, maxlength: 2000 },
    order: { type: Number, required: true, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QuestionSchema.index({ quiz: 1, order: 1 });
QuestionSchema.index({ quiz: 1, isPublished: 1 });

export const Question = defineModel("Question", QuestionSchema);
