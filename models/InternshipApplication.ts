import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";
export interface IInternshipApplication {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  internship: Types.ObjectId;
  message?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  resume?: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "waitlisted" | "withdrawn";
  appliedAt: Date;
  reviewedAt?: Date | null;
  reviewedBy?: Types.ObjectId | null;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IInternshipApplication>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    internship: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
      index: true,
    },
    message: { type: String, maxlength: 3000 },
    portfolioUrl: String,
    githubUrl: String,
    resume: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "waitlisted", "withdrawn"],
      default: "pending",
      index: true,
    },
    appliedAt: { type: Date, default: () => new Date() },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    adminNote: { type: String, maxlength: 3000 },
  },
  { timestamps: true },
);
schema.index({ student: 1, internship: 1 }, { unique: true });
export const InternshipApplication = defineModel(
  "InternshipApplication",
  schema,
);
