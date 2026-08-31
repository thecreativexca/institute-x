import type { IQuestion } from "@/models/Question";
import type { AttemptForEvaluation } from "./types";

export interface PerQuestionEvaluation {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean | null; // null when unanswered
  marksAwarded: number;
}

export interface EvaluationResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  perQuestion: PerQuestionEvaluation[];
}

/**
 * Server-side evaluation of an attempt against its published questions.
 *
 * Scoring rules:
 *   - correct answer   -> + question.marks
 *   - wrong answer     -> - question.negativeMarks (0 by default)
 *   - unanswered       -> 0
 *   - final score      -> clamped to >= 0 (negative marking can never push
 *                         the overall score below zero)
 *   - percentage       -> score / totalMarks * 100  (0 when no marks)
 *   - passed           -> percentage >= passingPercentage
 *
 * The score is computed entirely from the DB's questions and the attempt's
 * stored answers. The client never supplies a score or correct answers.
 */
export function evaluateAttempt(
  attempt: AttemptForEvaluation,
  questions: IQuestion[],
  passingPercentage: number
): EvaluationResult {
  const questionMap = new Map<string, IQuestion>();
  for (const q of questions) {
    questionMap.set(q._id.toString(), q);
  }

  const answerMap = new Map<string, string>();
  for (const a of attempt.answers) {
    answerMap.set(a.questionId.toString(), a.selectedOptionId);
  }

  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const perQuestion: PerQuestionEvaluation[] = [];

  // Evaluate only the questions the student actually saw (attempt.questionOrder).
  for (const qid of attempt.questionOrder) {
    const question = questionMap.get(qid.toString());
    if (!question) continue;

    totalMarks += question.marks;
    const selected = answerMap.get(qid.toString()) ?? null;

    if (selected === null) {
      unansweredCount += 1;
      perQuestion.push({
        questionId: qid.toString(),
        selectedOptionId: null,
        correctOptionId: question.correctOptionId,
        isCorrect: null,
        marksAwarded: 0,
      });
      continue;
    }

    if (selected === question.correctOptionId) {
      score += question.marks;
      correctCount += 1;
      perQuestion.push({
        questionId: qid.toString(),
        selectedOptionId: selected,
        correctOptionId: question.correctOptionId,
        isCorrect: true,
        marksAwarded: question.marks,
      });
    } else {
      score -= question.negativeMarks;
      incorrectCount += 1;
      perQuestion.push({
        questionId: qid.toString(),
        selectedOptionId: selected,
        correctOptionId: question.correctOptionId,
        isCorrect: false,
        marksAwarded: question.negativeMarks > 0 ? -question.negativeMarks : 0,
      });
    }
  }

  const clampedScore = Math.max(0, score);
  const percentage =
    totalMarks > 0
      ? Math.round((clampedScore / totalMarks) * 10000) / 100
      : 0;
  const passed = percentage >= passingPercentage;

  return {
    score: clampedScore,
    totalMarks,
    percentage,
    passed,
    correctCount,
    incorrectCount,
    unansweredCount,
    perQuestion,
  };
}
