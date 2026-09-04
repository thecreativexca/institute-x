import "server-only";
import { connectDB } from "@/lib/db/connect";
import { siteConfig } from "@/lib/config/site";
import { InstituteSettings } from "@/models/InstituteSettings";

export async function getInstituteSettings() {
  await connectDB(); const row = await InstituteSettings.findOne({ key: "default" }).lean();
  return {
    instituteName: row?.instituteName ?? siteConfig.name, portalName: row?.portalName ?? siteConfig.shortName,
    logoUrl: row?.logoUrl ?? siteConfig.logo, faviconUrl: row?.faviconUrl ?? "", email: row?.email ?? siteConfig.contact.email,
    phone: row?.phone ?? siteConfig.contact.phone, address: row?.address ?? siteConfig.contact.address, website: row?.website ?? siteConfig.url,
    facebook: row?.socialLinks?.facebook ?? "", instagram: row?.socialLinks?.instagram ?? "", youtube: row?.socialLinks?.youtube ?? "", linkedin: row?.socialLinks?.linkedin ?? "",
    defaultCurrency: row?.defaultCurrency ?? "INR", defaultCourseAccessDays: row?.defaultCourseAccessDays ?? null,
    certificateHeading: row?.certificateHeading ?? siteConfig.certificate.heading, certificateSignatoryName: row?.certificateSignatoryName ?? siteConfig.certificate.signatory.name,
    certificateSignatoryDesignation: row?.certificateSignatoryDesignation ?? siteConfig.certificate.signatory.designation,
    senderName: row?.senderName ?? process.env.RESEND_FROM_NAME ?? "", senderEmail: row?.senderEmail ?? process.env.RESEND_FROM_EMAIL ?? "",
    privacyPolicy: row?.privacyPolicy ?? "", termsAndConditions: row?.termsAndConditions ?? "", refundPolicy: row?.refundPolicy ?? "",
  };
}

export function getIntegrationStatus() {
  return {
    payments: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET),
    email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    uploads: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  };
}
