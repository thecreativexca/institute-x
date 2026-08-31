import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { PROGRESS_STATUSES, type ProgressStatus } from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Lesson } from "./Lesson";
import { User } from "./User";

/** Progress â€” per-lesson completion state for a student in a course. */
export interface IProgress {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  status: ProgressStatus;
  completedAt?: Date | null;
  lastViewedAt?: Date | null;
}

const ProgressSchema = new Schema<IProgress>(
  {
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
    lesson: {
      type: Schema.Types.ObjectId,
      ref: Lesson.modelName,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PROGRESS_STATUSES),
      default: PROGRESS_STATUSES.NOT_STARTED,
    },
    completedAt: { type: Date, default: null },
    lastViewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One progress record per student per lesson. `course` is included so reads of
// "my progress in this course" are served by a single index (spec §48).
ProgressSchema.index({ student: 1, course: 1, lesson: 1 }, { unique: true });
// Fast "my progress in this course" queries.
ProgressSchema.index({ student: 1, course: 1 });

export const Progress = defineModel("Progress", ProgressSchema);
