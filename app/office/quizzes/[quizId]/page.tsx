import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { getOfficeQuizById } from "@/lib/office/quizzes/queries";
import { Question } from "@/models/Question";
import { OfficeShell } from "@/components/office/OfficeShell";
import { QuizQuestionsClient } from "./QuizQuestionsClient";

export const dynamic = "force-dynamic";

export default async function OfficeQuizDetailPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { user } = await getValidatedSession();
  if (!user) redirect("/office/login");
  if (!canAccessAdmin(user.role)) redirect("/office/quizzes");
  const { quizId } = await params;
  if (!/^[a-f\d]{24}$/i.test(quizId)) notFound();
  const quiz = await getOfficeQuizById(quizId, user.id, user.role);
  if (!quiz) notFound();
  const questions = await Question.find({ quiz: quizId }).sort({ order: 1 }).lean();
  const questionData = questions.map((question) => ({
    id: question._id.toString(),
    question: question.question,
    options: question.options.map((option) => ({ id: option.id, text: option.text })),
    correctOptionId: question.correctOptionId,
    marks: question.marks,
  }));
  return (
    <OfficeShell session={user}>
      <div className="max-w-4xl space-y-5">
        <Link href="/office/quizzes" className="text-sm font-medium text-primary-700 hover:underline">← Back to quizzes</Link>
        <QuizQuestionsClient quiz={quiz} initialQuestions={questionData} />
      </div>
    </OfficeShell>
  );
}
