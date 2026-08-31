import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  SUBMISSION_STATUSES,
  type SubmissionStatus,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Assignment } from "./Assignment";
import { Course } from "./Course";
import { User } from "./User";

/**
 * Submission — a student's submitted work for a published assignment.
 *
 * Phase 11 introduces this schema so the progress system has a real,
 * non-duplicated source of truth for "Assignment Performance" (submitted /
 * pending / graded / late counts and normalized average marks).
 *
 * The full submission *workflow* (file upload via Cloudinary, resubmission,
 * grading UI in the Office Portal) is a later phase — this model is the
 * storage foundation those flows will write through, exactly like Assignment
 * and Quiz were introduced before their engines.
 *
 * Grading data:
 *   - `score` and `totalMarks` are snapshotted at grade time so historical
 *     averages never drift when an admin later changes `Assignment.maxScore`.
 *   - A submission is counted as "late" when `submittedAt > assignment.dueAt`;
 *     no separate flag is stored (section 47: derive, don't duplicate).
 */
export interface ISubmission {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course: Types.ObjectId;
  assignment: Types.ObjectId;
  status: SubmissionStatus;
  /** Optional answer text / notes the student attaches. */
  content?: string;
  /** File upload metadata arrives with the Phase 12+ submission engine. */
  fileUrl?: string;
  publicId?: string;
  originalFileName?: string;
  submittedAt: Date;
  gradedAt?: Date | null;
  /** Awarded marks (null until graded). */
  score?: number | null;
  /** Total possible marks for this submission (snapshot of Assignment.maxScore). */
  totalMarks?: number | null;
  feedback?: string | null;
}

const SubmissionSchema = new Schema<ISubmission>(
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
    assignment: {
      type: Schema.Types.ObjectId,
      ref: Assignment.modelName,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUSES),
      default: SUBMISSION_STATUSES.SUBMITTED,
      index: true,
    },
    content: { type: String, trim: true },
    fileUrl: { type: String },
    publicId: { type: String },
    originalFileName: { type: String, trim: true },
    submittedAt: { type: Date, required: true, default: () => new Date() },
    gradedAt: { type: Date, default: null },
    score: { type: Number, default: null, min: 0 },
    totalMarks: { type: Number, default: null, min: 0 },
    feedback: { type: String, default: null },
  },
  { timestamps: true }
);

// One submission record per student per assignment (latest submission wins when
// a resubmission supersedes an earlier one).
SubmissionSchema.index({ student: 1, assignment: 1 }, { unique: true });
// Fast "my submissions in this course" queries used by the progress services.
SubmissionSchema.index({ student: 1, course: 1 });
// Staff/grading list queries.
SubmissionSchema.index({ assignment: 1, status: 1 });

export const Submission = defineModel("Submission", SubmissionSchema);