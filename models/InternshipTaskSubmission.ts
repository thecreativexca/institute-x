import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";
const historySchema = new Schema(
  {
    text: String,
    files: [Schema.Types.Mixed],
    githubUrl: String,
    liveUrl: String,
    externalUrl: String,
    submittedAt: Date,
  },
  { _id: false },
);
export interface IInternshipTaskSubmission {
  _id: Types.ObjectId;
  task: Types.ObjectId;
  internship: Types.ObjectId;
  student: Types.ObjectId;
  text?: string;
  files: unknown[];
  githubUrl?: string;
  liveUrl?: string;
  externalUrl?: string;
  submittedAt: Date;
  status:
    | "pending"
    | "in_progress"
    | "submitted"
    | "reviewed"
    | "changes_required"
    | "completed";
  marks?: number | null;
  feedback?: string | null;
  reviewedAt?: Date | null;
  reviewedBy?: Types.ObjectId | null;
  history: unknown[];
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IInternshipTaskSubmission>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: "InternshipTask",
      required: true,
      index: true,
    },
    internship: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: String,
    files: { type: [Schema.Types.Mixed], default: [] },
    githubUrl: String,
    liveUrl: String,
    externalUrl: String,
    submittedAt: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "submitted",
        "reviewed",
        "changes_required",
        "completed",
      ],
      default: "submitted",
      index: true,
    },
    marks: { type: Number, min: 0, default: null },
    feedback: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);
schema.index({ task: 1, student: 1 }, { unique: true });
export const InternshipTaskSubmission = defineModel(
  "InternshipTaskSubmission",
  schema,
);
