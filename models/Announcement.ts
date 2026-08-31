import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { AUDIENCES, type Audience } from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { User } from "./User";
import { Course } from "./Course";

/** Announcement — notices published by staff to students/staff. */
export interface IAnnouncement {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  body: string;
  audience: Audience;
  course?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  isActive: boolean;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true },
    audience: {
      type: String,
      enum: Object.values(AUDIENCES),
      default: AUDIENCES.ALL,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      default: null,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
    },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ isActive: 1, publishedAt: -1 });
AnnouncementSchema.index({ audience: 1, course: 1 });

export const Announcement = defineModel("Announcement", AnnouncementSchema);
