"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAuditEvent } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InstituteSettings } from "@/models/InstituteSettings";

const optionalUrl = z.union([z.literal(""), z.string().url("Enter a valid URL.")]);
const schema = z.object({
  instituteName: z.string().trim().min(2).max(160), portalName: z.string().trim().min(2).max(100), logoUrl: optionalUrl, faviconUrl: optionalUrl,
  email: z.union([z.literal(""), z.string().email()]), phone: z.string().trim().max(30), address: z.string().trim().max(500), website: optionalUrl,
  facebook: optionalUrl, instagram: optionalUrl, youtube: optionalUrl, linkedin: optionalUrl,
  defaultCurrency: z.string().trim().length(3), defaultCourseAccessDays: z.number().int().positive().nullable(),
  certificateHeading: z.string().trim().min(2).max(160), certificateSignatoryName: z.string().trim().max(120), certificateSignatoryDesignation: z.string().trim().max(120),
  senderName: z.string().trim().max(120), senderEmail: z.union([z.literal(""), z.string().email()]), privacyPolicy: z.string().max(50000), termsAndConditions: z.string().max(50000), refundPolicy: z.string().max(50000),
});

export async function saveInstituteSettingsAction(input: z.infer<typeof schema>) {
  try {
    const { user } = await requireAdmin(); if (!user) return { ok: false, error: "Please sign in again." };
    const parsed = schema.safeParse(input);
    if (!parsed.success) { const fieldErrors: Record<string, string> = {}; for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message; return { ok: false, fieldErrors }; }
    await connectDB(); const data = parsed.data;
    const row = await InstituteSettings.findOneAndUpdate({ key: "default" }, { $set: { ...data, defaultCurrency: data.defaultCurrency.toUpperCase(), socialLinks: { facebook: data.facebook || undefined, instagram: data.instagram || undefined, youtube: data.youtube || undefined, linkedin: data.linkedin || undefined } } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    await recordAuditEvent({ actorUserId: user.id, actorRole: user.role, action: "settings.update", entityType: "settings", entityId: row._id.toString() });
    revalidatePath("/office/settings"); revalidatePath("/", "layout");
    return { ok: true, message: "Institute settings saved." };
  } catch (error) { console.error("Settings save failed:", error); return { ok: false, error: "Unable to save settings." }; }
}
