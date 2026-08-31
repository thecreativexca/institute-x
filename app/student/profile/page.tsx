import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Types } from "mongoose";
import { StudentProfileClient } from "./StudentProfileClient";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your student profile and account settings.",
  robots: { index: false, follow: false },
};

export default async function StudentProfilePage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findById(new Types.ObjectId(student.id))
    .select("name email phone avatarUrl emailVerifiedAt createdAt")
    .lean();

  if (!user) {
    redirect("/login");
  }

  const userDoc = user as unknown as { _id: Types.ObjectId; name: string; email: string; phone?: string; avatarUrl?: string; emailVerifiedAt?: Date | null; createdAt: Date };

  const userData: UserData = {
    _id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone,
    avatarUrl: userDoc.avatarUrl,
    emailVerifiedAt: userDoc.emailVerifiedAt?.toISOString() ?? null,
    createdAt: userDoc.createdAt.toISOString(),
  };

  return <StudentProfileClient user={userData} />;
}