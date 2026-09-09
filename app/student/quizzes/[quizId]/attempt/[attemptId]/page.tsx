import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { attemptParamsSchema } from "@/lib/quizzes/validation";
import { getStudentAttemptView } from "@/lib/quizzes/queries";
import { QuizError } from "@/lib/quizzes/errors";
import { QUIZ_ACCESS_ERROR } from "@/lib/quizzes/types";
import { AttemptClient } from "./AttemptClient";

export const metadata: Metadata = {
  title: "Test",
  description: "Take your test.",
  robots: { index: false, follow: false },
};

interface RouteParams {
  params: Promise<{ quizId: string; attemptId: string }>;
}

export default async function StudentQuizAttemptPage({ params }: RouteParams) {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const resolved = await params;
  const route = attemptParamsSchema.safeParse(resolved);
  if (!route.success) {
    redirect("/student/quizzes");
  }

  const data = await getStudentAttemptView(
    student.id,
    route.data.quizId,
    route.data.attemptId
  ).catch((err: unknown) => {
    if (err instanceof QuizError) {
      if (
        err.code === QUIZ_ACCESS_ERROR.ATTEMPT_EXPIRED ||
        err.code === QUIZ_ACCESS_ERROR.ATTEMPT_INVALID
      ) {
        redirect(`/student/quizzes/${route.data.quizId}/result/${route.data.attemptId}`);
      }
    }
    redirect(`/student/quizzes/${route.data.quizId}`);
  });

  return <AttemptClient data={data} />;
}
