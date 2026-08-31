import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { attemptParamsSchema } from "@/lib/quizzes/validation";
import { getStudentQuizResult } from "@/lib/quizzes/queries";
import { QuizError } from "@/lib/quizzes/errors";
import { QUIZ_ACCESS_ERROR } from "@/lib/quizzes/types";
import { QuizResultClient } from "./QuizResultClient";

export const metadata: Metadata = {
  title: "Test Result",
  description: "Your test result and review.",
  robots: { index: false, follow: false },
};

interface RouteParams {
  params: Promise<{ quizId: string; attemptId: string }>;
}

export default async function StudentQuizResultPage({ params }: RouteParams) {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login");
  }

  const resolved = await params;
  // Parse once and extract into plain strings so downstream code never
  // depends on discriminated-union narrowing across an await boundary.
  const parsed = attemptParamsSchema.safeParse(resolved);
  const quizId = parsed.success ? parsed.data.quizId : "";
  const attemptId = parsed.success ? parsed.data.attemptId : "";
  if (!quizId || !attemptId) {
    redirect(`/student/quizzes/${quizId}`);
  }

  const data = await getStudentQuizResult(student.id, quizId, attemptId).catch((err: unknown) => {
    if (err instanceof QuizError && err.code === QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND) {
      notFound();
    }
    if (err instanceof QuizError && err.code === QUIZ_ACCESS_ERROR.ATTEMPT_NOT_FOUND) {
      notFound();
    }
    redirect(`/student/quizzes/${quizId}`);
  });

  return <QuizResultClient data={data} />;
}
