import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";

export const INTERNSHIP_STATUSES = [
  "draft",
  "open",
  "running",
  "completed",
  "archived",
] as const;
export const INTERNSHIP_MODES = ["remote", "offline", "hybrid"] as const;
export type InternshipStatus = (typeof INTERNSHIP_STATUSES)[number];

export interface IInternship {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  durationValue: number;
  durationUnit: "days" | "weeks" | "months";
  startDate?: Date | null;
  endDate?: Date | null;
  mode: "remote" | "offline" | "hybrid";
  location?: string;
  paidOrUnpaid: "paid" | "unpaid";
  stipendAmount?: number | null;
  seats: number;
  skillsRequired: string[];
  eligibilityDescription?: string;
  eligibleCourses: Types.ObjectId[];
  minimumCourseProgress?: number | null;
  courseCompletionRequired: boolean;
  applicationRequired: boolean;
  autoApproval: boolean;
  openToAllActiveStudents: boolean;
  manuallySelectedStudents: Types.ObjectId[];
  status: InternshipStatus;
  applicationStartDate?: Date | null;
  applicationEndDate?: Date | null;
  banner?: {
    url: string;
    publicId?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
  };
  instructions?: string;
  completionRules: {
    requireTasks: boolean;
    requireProjects: boolean;
    minimumScore?: number | null;
    minimumProgress?: number | null;
  };
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

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
const InternshipSchema = new Schema<IInternship>(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: { type: String, trim: true, maxlength: 360 },
    description: { type: String, required: true },
    durationValue: { type: Number, required: true, min: 1 },
    durationUnit: {
      type: String,
      enum: ["days", "weeks", "months"],
      default: "weeks",
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    mode: {
      type: String,
      enum: INTERNSHIP_MODES,
      default: "remote",
      index: true,
    },
    location: { type: String, trim: true },
    paidOrUnpaid: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
    stipendAmount: { type: Number, min: 0, default: null },
    seats: { type: Number, min: 1, default: 1 },
    skillsRequired: { type: [String], default: [] },
    eligibilityDescription: String,
    eligibleCourses: [
      { type: Schema.Types.ObjectId, ref: "Course", index: true },
    ],
    minimumCourseProgress: { type: Number, min: 0, max: 100, default: null },
    courseCompletionRequired: { type: Boolean, default: false },
    applicationRequired: { type: Boolean, default: true },
    autoApproval: { type: Boolean, default: false },
    openToAllActiveStudents: { type: Boolean, default: false },
    manuallySelectedStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: INTERNSHIP_STATUSES,
      default: "draft",
      index: true,
    },
    applicationStartDate: { type: Date, default: null },
    applicationEndDate: { type: Date, default: null },
    banner: { type: fileSchema, default: undefined },
    instructions: String,
    completionRules: {
      requireTasks: { type: Boolean, default: true },
      requireProjects: { type: Boolean, default: true },
      minimumScore: { type: Number, min: 0, max: 100, default: null },
      minimumProgress: { type: Number, min: 0, max: 100, default: 100 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
InternshipSchema.index({ status: 1, updatedAt: -1 });
InternshipSchema.index({
  title: "text",
  shortDescription: "text",
  skillsRequired: "text",
});
export const Internship = defineModel("Internship", InternshipSchema);
