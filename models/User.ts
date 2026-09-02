import { Schema, type Types } from "mongoose";

import {
  ACCOUNT_STATUSES,
  USER_ROLES,
  type AccountStatus,
  type UserRole,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";

/**
 * User — students and admins.
 * Two-role system: ADMIN (full admin portal access) and STUDENT (student portal only).
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
  employeeCode?: string;
  designation?: string;
  department?: string;
  avatarUrl?: string;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  lastOfficeLoginAt?: Date | null;
  sessionVersion: number;
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
    employeeCode: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    avatarUrl: { type: String },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastOfficeLoginAt: { type: Date, default: null },
    sessionVersion: { type: Number, default: 0 },
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
UserSchema.index({ role: 1, status: 1 });

// Mongoose 9 middleware is promise-based: there is no `next` callback.
// Any legacy row that still holds an old role (e.g. "super admin",
// OFFICE_STAFF, FACULTY, …) is normalized here — BEFORE the role enum
// validator runs — so loading/saving a stale document can't throw. Because the
// hook mutates the in-memory document, the corrected role is also what any
// caller sees immediately after save (e.g. login building the session).
UserSchema.pre("validate", async function () {
  const raw = this.get("role");
  if (typeof raw === "string") {
    const folded = raw.toLowerCase().replace(/[\s_-]+/g, "");
    const target = folded.includes("student") ? USER_ROLES.STUDENT : USER_ROLES.ADMIN;
    if (raw !== target) this.set("role", target);
  }
});

export const User = defineModel("User", UserSchema);