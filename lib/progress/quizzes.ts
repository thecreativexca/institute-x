import type { QuizStatSummary } from "./types";
import { normalizedPercentage } from "./percentages";

/**
 * Pure quiz performance calculations (spec §18–§20).
 *
 * Multiple-attempt policy (documented, spec §19):
 *   - Each quiz contributes exactly ONE "best" attempt — the finalized
 *     (submitted/expired) attempt with the highest percentage. Ties break on
 *     the most recently submitted attempt.
 *   - Retakes are NEVER counted as separate quizzes in counts or averages.
 *   - The overall average is the NORMALIZED best-attempt performance:
 *     `Σ bestScore / Σ bestTotalMarks × 100` — raw percentages from quizzes
 *     with different total marks are not averaged directly (spec §20).
 *
 * Only FINALIZED attempts are considered ("best valid submitted attempt").
 * In-progress attempts are ignored for performance summaries.
 *
 * This module is dependency-free so it can be unit-tested with node.
 */

export interface QuizRow {
  _id: string;
  title: string;
  type: string;
  passingPercentage: number;
}

export interface AttemptRow {
  _id: string;
  quizId: string;
  attemptNumber: number;
  status: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string | null;
  createdAt: string;
}

const SUBMITTED = "submitted";
const EXPIRED = "expired";
const FINAL = "final";

function isFinalized(status: string): boolean {
  return status === SUBMITTED || status === EXPIRED;
}

/** Picks the single best finalized attempt for a quiz (best-attempt policy). */
export function pickBestAttempt(
  attempts: AttemptRow[]
): AttemptRow | null {
  const finalized = attempts.filter((a) => isFinalized(a.status));
  if (finalized.length === 0) return null;

  return [...finalized].sort((a, b) => {
    if (a.percentage !== b.percentage) return b.percentage - a.percentage;
    return Date.parse(b.submittedAt ?? b.createdAt) - Date.parse(a.submittedAt ?? a.createdAt);
  })[0];
}

/**
 * Derives the quiz performance summary for one course.
 *
 * `availableQuizzes` counts published quizzes (final assessments included).
 * `averagePercent` is normalized and null when nothing has been attempted.
 */
export function computeQuizSummary(input: {
  quizzes: QuizRow[];
  attemptsByQuizId: ReadonlyMap<string, AttemptRow[]>;
}): QuizStatSummary {
  const { quizzes, attemptsByQuizId } = input;

  const availableQuizzes = quizzes.length;
  let attempted = 0;
  let passed = 0;
  let failed = 0;
  let awarded = 0;
  let possible = 0;
  let hasPossible = false;

  const bestAttempts: QuizStatSummary["bestAttempts"] = [];

  for (const quiz of quizzes) {
    const attempts = attemptsByQuizId.get(quiz._id) ?? [];
    const best = pickBestAttempt(attempts);
    if (!best) continue;

    attempted += 1;
    if (best.passed) passed += 1;
    else failed += 1;

    if (best.totalMarks > 0 && Number.isFinite(best.score)) {
      awarded += best.score;
      possible += best.totalMarks;
      hasPossible = true;
    }

    bestAttempts.push({
      quizId: quiz._id,
      title: quiz.title,
      type: quiz.type as QuizStatSummary["bestAttempts"][number]["type"],
      attemptId: best._id,
      attemptNumber: best.attemptNumber,
      percentage: best.percentage,
      score: best.score,
      totalMarks: best.totalMarks,
      passed: best.passed,
      submittedAt: best.submittedAt,
    });
  }

  bestAttempts.sort(
    (a, b) => Date.parse(b.submittedAt ?? "") - Date.parse(a.submittedAt ?? "")
  );

  const finalQuiz = quizzes.find((q) => q.type === FINAL) ?? null;
  const finalBest = finalQuiz
    ? pickBestAttempt(attemptsByQuizId.get(finalQuiz._id) ?? [])
    : null;

  return {
    availableQuizzes,
    attempted,
    passed,
    failed,
    averagePercent: hasPossible
      ? Math.round(normalizedPercentage(awarded, possible) ?? 0)
      : null,
    bestAttempts,
    finalTest: finalQuiz
      ? {
          quizId: finalQuiz._id,
          title: finalQuiz.title,
          attempted: finalBest !== null,
          passed: finalBest?.passed ?? false,
          bestPercentage: finalBest?.percentage ?? null,
        }
      : null,
  };
}