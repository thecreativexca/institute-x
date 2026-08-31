import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentQuizSummaries } from "@/lib/quizzes/queries";
import { StudentQuizzesClient } from "./StudentQuizzesClient";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "Take quizzes and tests for your enrolled courses.",
  robots: { index: false, follow: false },
};

export default async function StudentQuizzesPage() {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login");
  }

  const quizzes = await getStudentQuizSummaries(student.id);
  return <StudentQuizzesClient quizzes={quizzes} />;
}
