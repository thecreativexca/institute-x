import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { StudentSupportClient } from "./StudentSupportClient";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help and support for your learning journey.",
  robots: { index: false, follow: false },
};

export default async function StudentSupportPage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login");
  }

  return <StudentSupportClient />;
}