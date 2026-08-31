import { Schema, type Types } from "mongoose";

import {
  ACCOUNT_STATUSES,
  USER_ROLES,
  type AccountStatus,
  type UserRole,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";

/**
 * User — students and staff (foundational architecture).
 * Authentication flows, password hashing and RBAC arrive in later phases;
 * the password hash field already exists so schemas stay stable.
 */
export interface IUser {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  email: string;
  phone?: string;
  /** bcrypt/argon hash. select:false so it never leaves the DB by default. */
  passwordHash?: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  lastOfficeLoginAt?: Date | null;
  sessionVersion: number;
  employeeCode?: string;
  designation?: string;
  department?: string;
  emailVerificationToken?: string;
  emailVerificationTokenExpiresAt?: Date | null;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STUDENT,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUSES),
      default: ACCOUNT_STATUSES.ACTIVE,
    },
    avatarUrl: { type: String },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastOfficeLoginAt: { type: Date, default: null },
    sessionVersion: { type: Number, default: 0 },
    employeeCode: { type: String, trim: true, sparse: true, unique: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    emailVerificationToken: { type: String, select: false },
    emailVerificationTokenExpiresAt: { type: Date, default: null, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetTokenExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });
UserSchema.index({ emailVerificationTokenExpiresAt: 1 });
UserSchema.index({ passwordResetTokenExpiresAt: 1 });
// employeeCode is already uniquely+sparsely indexed via its field definition,
// so no separate schema-level index is declared here (avoids a duplicate).
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ department: 1 });

export const User = defineModel("User", UserSchema);
