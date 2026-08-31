import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  QUIZ_ATTEMPT_STATUSES,
  type QuizAttemptStatus,
} from "@/lib/constants";
import { defineModel } from "@/lib/mongodb/model-registry";
import { Quiz } from "./Quiz";
import { User } from "./User";
import { Course } from "./Course";

/**
 * QuizAttempt â€” one student's attempt at one quiz.
 *
 * This is the single source of truth for a student's answers and final score.
 * Everything is server-authoritative:
 *   - `questionOrder` is the (possibly randomized) order the student saw
 *   - `optionOrders` is the (possibly randomized) option order per question
 *   - `answers` stores questionId -> selectedOptionId (no correct answers)
 *   - `score`/`percentage`/`passed` are computed server-side on submission
 *
 * Once status becomes SUBMITTED or EXPIRED the attempt is immutable.
 */
export interface IQuizAnswer {
  questionId: Types.ObjectId;
  selectedOptionId: string;
}

export interface IQuizOptionOrder {
  questionId: Types.ObjectId;
  optionOrder: string[];
}

export interface IQuizAttempt {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  quiz: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date | null;
  status: QuizAttemptStatus;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  answers: IQuizAnswer[];
  /** Question order actually shown to the student. */
  questionOrder: Types.ObjectId[];
  optionOrders: IQuizOptionOrder[];
  timeTakenSeconds?: number | null;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOptionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
  },
  { _id: false }
);

const QuizOptionOrderSchema = new Schema<IQuizOptionOrder>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    optionOrder: { type: [String], required: true },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: Quiz.modelName,
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    startedAt: { type: Date, required: true, default: () => new Date() },
    submittedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(QUIZ_ATTEMPT_STATUSES),
      default: QUIZ_ATTEMPT_STATUSES.IN_PROGRESS,
    },
    score: { type: Number, default: 0, min: 0 },
    totalMarks: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    passed: { type: Boolean, default: false },
    attemptNumber: { type: Number, required: true, min: 1 },
    answers: { type: [QuizAnswerSchema], default: [] },
    questionOrder: { type: [Schema.Types.ObjectId], default: [] },
    optionOrders: { type: [QuizOptionOrderSchema], default: [] },
    timeTakenSeconds: { type: Number, default: null },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ quiz: 1, student: 1 });
QuizAttemptSchema.index({ student: 1, createdAt: -1 });
QuizAttemptSchema.index({ quiz: 1, student: 1, status: 1 });
QuizAttemptSchema.index({ student: 1, quiz: 1, status: 1 });
// Course-scoped reads for the progress system (spec §48).
QuizAttemptSchema.index({ student: 1, course: 1, quiz: 1 });

export const QuizAttempt = defineModel("QuizAttempt", QuizAttemptSchema);
