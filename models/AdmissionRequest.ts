import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";

export const ADMISSION_REQUEST_TYPES = ["contact", "enrollment"] as const;
export const ADMISSION_REQUEST_STATUSES = ["new", "contacted", "closed"] as const;

export type AdmissionRequestType = (typeof ADMISSION_REQUEST_TYPES)[number];
export type AdmissionRequestStatus = (typeof ADMISSION_REQUEST_STATUSES)[number];

export interface IAdmissionRequest {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  type: AdmissionRequestType;
  status: AdmissionRequestStatus;
  fullName: string;
  phone: string;
  email?: string;
  course?: Types.ObjectId | null;
  courseName?: string;
  message?: string;
  sourcePath?: string;
}

const AdmissionRequestSchema = new Schema<IAdmissionRequest>(
  {
    type: { type: String, enum: ADMISSION_REQUEST_TYPES, required: true, index: true },
    status: { type: String, enum: ADMISSION_REQUEST_STATUSES, default: "new", index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 24 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    course: { type: Schema.Types.ObjectId, ref: Course.modelName, default: null, index: true },
    courseName: { type: String, trim: true, maxlength: 180 },
    message: { type: String, trim: true, maxlength: 1500 },
    sourcePath: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

AdmissionRequestSchema.index({ createdAt: -1 });
AdmissionRequestSchema.index({ status: 1, createdAt: -1 });
AdmissionRequestSchema.index({ type: 1, createdAt: -1 });

export const AdmissionRequest = defineModel("AdmissionRequest", AdmissionRequestSchema);
