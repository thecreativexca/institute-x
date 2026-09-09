import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";
const snapshot = new Schema(
  {
    text: String,
    githubUrl: String,
    liveUrl: String,
    otherUrl: String,
    files: [Schema.Types.Mixed],
    submittedAt: Date,
  },
  { _id: false },
);
export interface IProjectSubmission {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  student: Types.ObjectId;
  internship?: Types.ObjectId | null;
  text?: string;
  githubUrl?: string;
  liveUrl?: string;
  otherUrl?: string;
  files: unknown[];
  status:
    | "not_started"
    | "in_progress"
    | "submitted"
    | "under_review"
    | "changes_required"
    | "approved"
    | "completed";
  score?: number | null;
  feedback?: string | null;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: Types.ObjectId | null;
  history: unknown[];
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IProjectSubmission>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    internship: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      default: null,
    },
    text: String,
    githubUrl: String,
    liveUrl: String,
    otherUrl: String,
    files: { type: [Schema.Types.Mixed], default: [] },
    status: {
      type: String,
      enum: [
        "not_started",
        "in_progress",
        "submitted",
        "under_review",
        "changes_required",
        "approved",
        "completed",
      ],
      default: "submitted",
      index: true,
    },
    score: { type: Number, min: 0, default: null },
    feedback: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    history: { type: [snapshot], default: [] },
  },
  { timestamps: true },
);
schema.index({ project: 1, student: 1 }, { unique: true });
export const ProjectSubmission = defineModel("ProjectSubmission", schema);
