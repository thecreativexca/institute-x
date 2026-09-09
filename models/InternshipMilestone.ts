import { Schema, type Types } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";
export interface IInternshipMilestone {
  _id: Types.ObjectId;
  internship: Types.ObjectId;
  title: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  sortOrder: number;
  required: boolean;
  linkedTasks: Types.ObjectId[];
  linkedProjects: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
const schema = new Schema<IInternshipMilestone>(
  {
    internship: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 180 },
    description: String,
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
    required: { type: Boolean, default: true },
    linkedTasks: [{ type: Schema.Types.ObjectId, ref: "InternshipTask" }],
    linkedProjects: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  },
  { timestamps: true },
);
schema.index({ internship: 1, sortOrder: 1 });
export const InternshipMilestone = defineModel("InternshipMilestone", schema);
