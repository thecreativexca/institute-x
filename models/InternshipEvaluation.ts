import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";
export interface IInternshipEvaluation {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  internship: Types.ObjectId;
  criteria: Array<{ name: string; score: number; maxScore: number }>;
  totalScore: number;
  percentage: number;
  grade: string;
  adminFeedback?: string;
  evaluatedAt: Date;
  evaluatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const criterion = new Schema(
  {
    name: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);
const schema = new Schema<IInternshipEvaluation>(
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
    criteria: { type: [criterion], required: true },
    totalScore: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, required: true },
    adminFeedback: String,
    evaluatedAt: { type: Date, default: () => new Date() },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
schema.index({ student: 1, internship: 1 }, { unique: true });
export const InternshipEvaluation = defineModel("InternshipEvaluation", schema);
