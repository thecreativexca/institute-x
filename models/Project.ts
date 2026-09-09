import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";
const fileSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    filename: String,
    mimeType: String,
    size: Number,
  },
  { _id: false },
);
export interface IProject {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  instructions?: string;
  course?: Types.ObjectId | null;
  internship?: Types.ObjectId | null;
  assignedStudents: Types.ObjectId[];
  difficulty: "beginner" | "intermediate" | "advanced";
  startDate?: Date | null;
  dueDate?: Date | null;
  totalMarks: number;
  passingMarks?: number | null;
  required: boolean;
  allowLateSubmission: boolean;
  resourceFiles: unknown[];
  submissionRequirements: string[];
  status: "draft" | "published" | "closed" | "archived";
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IProject>(
  {
    title: { type: String, required: true, maxlength: 180 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, required: true },
    instructions: String,
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    internship: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      default: null,
      index: true,
    },
    assignedStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    totalMarks: { type: Number, min: 1, default: 100 },
    passingMarks: { type: Number, min: 0, default: null },
    required: { type: Boolean, default: true },
    allowLateSubmission: { type: Boolean, default: false },
    resourceFiles: { type: [fileSchema], default: [] },
    submissionRequirements: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "draft",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
schema.index({ title: "text", description: "text" });
schema.index({ status: 1, dueDate: 1 });
export const Project = defineModel("Project", schema);
