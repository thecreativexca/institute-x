import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { StudentProgressClient } from "./StudentProgressClient";
import { getStudentProgressOverview } from "@/lib/student/progress-overview";

export const metadata: Metadata = {
  title: "Progress",
  description: "Track your learning progress across all courses.",
  robots: { index: false, follow: false },
};

export default async function StudentProgressPage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const overview = await getStudentProgressOverview(student.id);
  return <StudentProgressClient overview={overview} />;
}
