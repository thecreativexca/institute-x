import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";
export interface IInternshipEnrollment {
  _id: Types.ObjectId;
  internship: Types.ObjectId;
  student: Types.ObjectId;
  application?: Types.ObjectId | null;
  status: "selected" | "active" | "paused" | "completed" | "removed";
  joinedAt: Date;
  startDate?: Date | null;
  endDate?: Date | null;
  progressPercentage: number;
  completedTasks: number;
  totalTasks: number;
  completedProjects: number;
  totalProjects: number;
  finalScore?: number | null;
  grade?: string | null;
  completedAt?: Date | null;
  certificate?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IInternshipEnrollment>(
  {
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
    application: {
      type: Schema.Types.ObjectId,
      ref: "InternshipApplication",
      default: null,
    },
    status: {
      type: String,
      enum: ["selected", "active", "paused", "completed", "removed"],
      default: "selected",
      index: true,
    },
    joinedAt: { type: Date, default: () => new Date() },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    completedTasks: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    totalProjects: { type: Number, default: 0 },
    finalScore: { type: Number, default: null },
    grade: { type: String, default: null },
    completedAt: { type: Date, default: null },
    certificate: {
      type: Schema.Types.ObjectId,
      ref: "Certificate",
      default: null,
    },
  },
  { timestamps: true },
);
schema.index({ internship: 1, student: 1 }, { unique: true });
export const InternshipEnrollment = defineModel("InternshipEnrollment", schema);
