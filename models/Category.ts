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
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    thumbnailUrl: { type: String, trim: true },
    thumbnailPublicId: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    seoTitle: { type: String, trim: true, maxlength: 200 },
    seoDescription: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

CategorySchema.index({ sortOrder: 1, name: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });

export const Category = defineModel("Category", CategorySchema);
