import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { ProfileEditForm } from "./ProfileEditForm";
export default async function EditProfilePage() { const { user } = await getValidatedStudent(); if (!user) redirect("/login"); await connectDB(); const row = await User.findById(user.id).select("name phone avatarUrl address education").lean(); if (!row) redirect("/login"); return <ProfileEditForm initial={{ name: row.name, phone: row.phone ?? "", avatarUrl: row.avatarUrl ?? "", address: row.address ?? "", education: row.education ?? "" }} />; }
