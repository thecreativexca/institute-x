import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";

/** Module â€” an ordered group of lessons inside a course (curriculum). */
export interface IModule {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  course: Types.ObjectId;
  title: string;
  description?: string;
  sortOrder: number;
  /** Draft modules stay office-only; students only see published modules. */
  isPublished: boolean;
}

const ModuleSchema = new Schema<IModule>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ModuleSchema.index({ course: 1, sortOrder: 1 });
ModuleSchema.index({ course: 1, isPublished: 1 });

export const Module = defineModel("Module", ModuleSchema);
