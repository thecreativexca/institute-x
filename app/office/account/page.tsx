import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OfficeShell } from "@/components/office/OfficeShell";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { OfficeAccountClient } from "./OfficeAccountClient";

export const metadata: Metadata = {
  title: "My Account — Office Portal",
  description: "Manage your Office Portal profile and password.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OfficeAccountPage() {
  const { user: session } = await getValidatedSession();
  if (!session) redirect("/office/login?callbackUrl=/office/account");
  if (!canAccessOffice(session.role)) redirect("/student/dashboard");

  await connectDB();
  const user = await User.findById(session.id)
    .select("name email phone role status avatarUrl employeeCode designation department emailVerifiedAt lastOfficeLoginAt createdAt")
    .lean();
  if (!user) redirect("/office/login");

  const account = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    employeeCode: user.employeeCode,
    designation: user.designation,
    department: user.department,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    lastOfficeLoginAt: user.lastOfficeLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <OfficeShell session={{ ...session, avatarUrl: user.avatarUrl, designation: user.designation, department: user.department }}>
      <OfficeAccountClient account={account} />
    </OfficeShell>
  );
}
