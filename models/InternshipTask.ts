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
export interface IInternshipTask {
  _id: Types.ObjectId;
  internship: Types.ObjectId;
  title: string;
  description: string;
  instructions?: string;
  startDate?: Date | null;
  dueDate?: Date | null;
  priority: "low" | "normal" | "high" | "urgent";
  attachments: unknown[];
  points?: number | null;
  required: boolean;
  sortOrder: number;
  status: "draft" | "published" | "closed";
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IInternshipTask>(
  {
    internship: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 180 },
    description: { type: String, required: true },
    instructions: String,
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    attachments: { type: [fileSchema], default: [] },
    points: { type: Number, min: 0, default: null },
    required: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true },
);
schema.index({ internship: 1, sortOrder: 1 });
export const InternshipTask = defineModel("InternshipTask", schema);
