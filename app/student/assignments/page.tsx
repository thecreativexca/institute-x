import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { StudentAssignmentsClient } from "./StudentAssignmentsClient";
import { getStudentAssignments } from "@/lib/student/assignments";

export const metadata: Metadata = {
  title: "Assignments",
  description: "View and manage your course assignments.",
  robots: { index: false, follow: false },
};

export default async function StudentAssignmentsPage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const assignments = await getStudentAssignments(student.id);
  return <StudentAssignmentsClient assignments={assignments} />;
}
