import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Module } from "./Module";
import { Lesson } from "./Lesson";
import { RESOURCE_TYPES, RESOURCE_ACCESS, type ResourceType, type ResourceAccess } from "@/lib/constants";

export interface IResource {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  course: Types.ObjectId;
  module: Types.ObjectId;
  lesson: Types.ObjectId;
  title: string;
  description?: string;
  type: ResourceType;
  fileUrl: string;
  publicId: string;
  mimeType: string;
  fileSize: number;
  originalFileName: string;
  access: ResourceAccess;
  isPublished: boolean;
  sortOrder: number;
}

const ResourceSchema = new Schema<IResource>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: Module.modelName,
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: Lesson.modelName,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    type: {
      type: String,
      enum: Object.values(RESOURCE_TYPES),
      default: RESOURCE_TYPES.PDF,
    },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    originalFileName: { type: String, required: true, trim: true },
    access: {
      type: String,
      enum: Object.values(RESOURCE_ACCESS),
      default: RESOURCE_ACCESS.VIEW_AND_DOWNLOAD,
    },
    isPublished: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ResourceSchema.index({ lesson: 1, sortOrder: 1 });
ResourceSchema.index({ lesson: 1, isPublished: 1, sortOrder: 1 });
ResourceSchema.index({ course: 1, isPublished: 1 });

export const Resource = defineModel("Resource", ResourceSchema);
