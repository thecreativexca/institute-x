"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";

const profileSchema = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30), avatarUrl: z.union([z.literal(""), z.string().url()]), address: z.string().trim().max(500), education: z.string().trim().max(500) });
export async function updateStudentProfileAction(input: z.infer<typeof profileSchema>) {
  try { const { user } = await getValidatedStudent(); if (!user) return { ok: false, error: "Please sign in again." }; const parsed = profileSchema.safeParse(input); if (!parsed.success) { const fieldErrors: Record<string, string> = {}; for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message; return { ok: false, fieldErrors }; } await connectDB(); await User.updateOne({ _id: user.id, role: "student" }, { $set: { ...parsed.data, avatarUrl: parsed.data.avatarUrl || undefined } }); revalidatePath("/student", "layout"); revalidatePath("/student/profile"); return { ok: true, message: "Profile updated." }; } catch (error) { console.error("Student profile update failed:", error); return { ok: false, error: "Unable to update profile." }; }
}

const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128).regex(/[A-Z]/, "Include an uppercase letter.").regex(/[a-z]/, "Include a lowercase letter.").regex(/[0-9]/, "Include a number."), confirmPassword: z.string() }).refine((data) => data.newPassword === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
export async function changeStudentPasswordAction(input: z.infer<typeof passwordSchema>) {
  try { const { user } = await getValidatedStudent(); if (!user) return { ok: false, error: "Please sign in again." }; const parsed = passwordSchema.safeParse(input); if (!parsed.success) { const fieldErrors: Record<string, string> = {}; for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message; return { ok: false, fieldErrors }; } await connectDB(); const account = await User.findOne({ _id: user.id, role: "student" }).select("+passwordHash"); if (!account?.passwordHash || !(await verifyPassword(parsed.data.currentPassword, account.passwordHash))) return { ok: false, fieldErrors: { currentPassword: "Current password is incorrect." } }; account.passwordHash = await hashPassword(parsed.data.newPassword); account.sessionVersion += 1; await account.save(); return { ok: true, message: "Password changed. Sign in again with your new password." }; } catch (error) { console.error("Student password change failed:", error); return { ok: false, error: "Unable to change password." }; }
}
