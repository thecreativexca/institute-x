import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { STAFF_STATUSES, type StaffStatus } from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { User } from "./User";

export interface IStaffProfile {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  user: Types.ObjectId;
  employeeCode: string;
  designation?: string;
  department?: string;
  status: StaffStatus;
  joinedAt: Date;
  reportingManager?: Types.ObjectId;
  notes?: string;
}

const StaffProfileSchema = new Schema<IStaffProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      unique: true,
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    designation: { type: String, trim: true, maxlength: 100 },
    department: { type: String, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: Object.values(STAFF_STATUSES),
      default: STAFF_STATUSES.ACTIVE,
      index: true,
    },
    joinedAt: { type: Date, default: () => new Date() },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: "StaffProfile",
    },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

StaffProfileSchema.index({ department: 1, status: 1 });
StaffProfileSchema.index({ reportingManager: 1 });

export const StaffProfile = defineModel("StaffProfile", StaffProfileSchema);