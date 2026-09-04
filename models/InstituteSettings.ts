import type { Types } from "mongoose";
import { Schema } from "mongoose";
import { defineModel } from "@/lib/mongodb/model-registry";

export interface IInstituteSettings {
  _id: Types.ObjectId; createdAt: Date; updatedAt: Date; key: "default";
  instituteName: string; portalName: string; logoUrl?: string; faviconUrl?: string;
  email?: string; phone?: string; address?: string; website?: string;
  socialLinks: { facebook?: string; instagram?: string; youtube?: string; linkedin?: string };
  defaultCurrency: string; defaultCourseAccessDays?: number | null;
  certificateHeading: string; certificateSignatoryName?: string; certificateSignatoryDesignation?: string;
  senderName?: string; senderEmail?: string;
  privacyPolicy?: string; termsAndConditions?: string; refundPolicy?: string;
}

const InstituteSettingsSchema = new Schema<IInstituteSettings>({
  key: { type: String, enum: ["default"], default: "default", unique: true },
  instituteName: { type: String, required: true, trim: true, maxlength: 160 }, portalName: { type: String, required: true, trim: true, maxlength: 100 },
  logoUrl: { type: String, trim: true }, faviconUrl: { type: String, trim: true }, email: { type: String, trim: true, lowercase: true }, phone: { type: String, trim: true }, address: { type: String, trim: true }, website: { type: String, trim: true },
  socialLinks: { facebook: String, instagram: String, youtube: String, linkedin: String },
  defaultCurrency: { type: String, default: "INR", uppercase: true, maxlength: 3 }, defaultCourseAccessDays: { type: Number, default: null, min: 1 },
  certificateHeading: { type: String, default: "Certificate of Completion", maxlength: 160 }, certificateSignatoryName: { type: String, trim: true }, certificateSignatoryDesignation: { type: String, trim: true },
  senderName: { type: String, trim: true }, senderEmail: { type: String, trim: true, lowercase: true },
  privacyPolicy: String, termsAndConditions: String, refundPolicy: String,
}, { timestamps: true });

export const InstituteSettings = defineModel("InstituteSettings", InstituteSettingsSchema);
