import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Resource } from "./Resource";
import { User } from "./User";

export interface IReadingProgress {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course: Types.ObjectId;
  resource: Types.ObjectId;
  lastPage: number;
  totalPages: number;
  progressPercentage: number;
  bookmarks: number[];
  lastReadAt: Date;
}

const ReadingProgressSchema = new Schema<IReadingProgress>(
  {
    student: { type: Schema.Types.ObjectId, ref: User.modelName, required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: Course.modelName, required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: Resource.modelName, required: true, index: true },
    lastPage: { type: Number, required: true, default: 1, min: 1 },
    totalPages: { type: Number, required: true, default: 1, min: 1 },
    progressPercentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
    bookmarks: { type: [Number], default: [] },
    lastReadAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

ReadingProgressSchema.index({ student: 1, resource: 1 }, { unique: true });
ReadingProgressSchema.index({ student: 1, course: 1, lastReadAt: -1 });

export const ReadingProgress = defineModel("ReadingProgress", ReadingProgressSchema);
