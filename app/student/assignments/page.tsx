import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { StudentAssignmentsClient } from "./StudentAssignmentsClient";

export const metadata: Metadata = {
  title: "Assignments",
  description: "View and manage your course assignments.",
  robots: { index: false, follow: false },
};

export default async function StudentAssignmentsPage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login");
  }

  return <StudentAssignmentsClient />;
}