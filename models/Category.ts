import { Schema, type Types } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";

/** Category â€” groups courses (e.g. "Web & Programming"). */
export interface ICategory {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.index({ sortOrder: 1, name: 1 });

export const Category = defineModel("Category", CategorySchema);
