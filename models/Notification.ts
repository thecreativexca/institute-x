import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { User } from "./User";

export interface INotification {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  recipient: Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link?: string;
  isRead: boolean;
  readAt?: Date | null;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: User.modelName, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
  link: { type: String, trim: true, maxlength: 500 },
  isRead: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const Notification = defineModel("Notification", NotificationSchema);
