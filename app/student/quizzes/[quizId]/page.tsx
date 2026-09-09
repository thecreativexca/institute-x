import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { quizIdParamSchema } from "@/lib/quizzes/validation";
import { getStudentQuizDetail } from "@/lib/quizzes/queries";
import { QuizError } from "@/lib/quizzes/errors";
import { QUIZ_ACCESS_ERROR } from "@/lib/quizzes/types";
import { QuizDetailClient } from "./QuizDetailClient";

export const metadata: Metadata = {
  title: "Test Details",
  description: "Review test instructions before starting.",
  robots: { index: false, follow: false },
};

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

export default async function StudentQuizDetailPage({ params }: RouteParams) {
  const { user: student, error } = await getValidatedStudent();
  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const resolved = await params;
  const route = quizIdParamSchema.safeParse(resolved);
  if (!route.success) {
    notFound();
  }

  let detail: Awaited<ReturnType<typeof getStudentQuizDetail>> | null = null;
  let blockReason: string | null = null;
  try {
    detail = await getStudentQuizDetail(student.id, route.data.quizId);
  } catch (err) {
    if (err instanceof QuizError) {
      if (err.code === QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND) {
        notFound();
      }
      blockReason = err.message;
    } else {
      blockReason = "Unable to load this test right now.";
    }
  }

  return <QuizDetailClient detail={detail} blockReason={blockReason ?? undefined} />;
}
