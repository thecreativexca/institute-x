import { redirect } from "next/navigation";

export default async function QuizQuestionsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  redirect(`/office/quizzes/${quizId}`);
}
