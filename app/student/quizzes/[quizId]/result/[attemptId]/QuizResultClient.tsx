"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { QuizResultViewData } from "@/lib/quizzes/types";
import { cn } from "@/lib/utils/cn";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Award,
  RotateCcw,
  Trophy,
  Calendar,
  Lightbulb,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  module: "Module Test",
  lesson: "Lesson Quiz",
  final: "Final Test",
};

function formatDate(v: string | null | undefined): string {
  if (!v) return "—";
  try {
    return format(new Date(v), "MMM d, yyyy h:mm a");
  } catch {
    return "—";
  }
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function QuizResultClient({ data }: { data: QuizResultViewData }) {
  const passed = data.passed;
  return (
      <div className="space-y-6">
        <Link
          href={`/student/quizzes/${data.quizId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Test
        </Link>

        <section className="student-page-header">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{TYPE_LABELS[data.type] ?? data.type}</Badge>
            <Badge variant={passed ? "success" : data.status === "expired" ? "warning" : "danger"}>
              {passed ? "Passed" : data.status === "expired" ? "Expired" : "Failed"}
            </Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{data.quizTitle}</h1>
          <p className="mt-1 text-slate-600">{data.courseTitle} · Attempt #{data.attemptNumber}</p>
        </section>

        {/* Summary */}
        <Card className="rounded-2xl border-primary-100">
          <CardContent className="p-6 sm:p-8">
            <div
              className={cn(
                "mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border p-6 text-center",
                passed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
              )}
            >
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full",
                  passed ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                )}
              >
                {passed ? (
                  <Trophy className="h-8 w-8" aria-hidden="true" />
                ) : (
                  <XCircle className="h-8 w-8" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {data.score} / {data.totalMarks}
                </p>
                <p className="text-lg font-semibold text-slate-700">
                  Score · {data.percentage}%
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium",
                    passed ? "text-emerald-700" : "text-red-700"
                  )}
                >
                  {passed ? "Congratulations, you passed!" : "You did not pass this time."}
                  {data.passingPercentage > 0 && ` (Passing: ${data.passingPercentage}%)`}
                </p>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-2xl">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">Percentage</span>
                <span className="font-medium text-slate-900">{data.percentage}%</span>
              </div>
              <Progress
                value={data.percentage}
                className={cn("h-3", passed ? "bg-emerald-100" : "bg-red-100")}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-xl bg-primary-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" aria-hidden="true" />
                <p className="mt-1 text-xl font-bold text-slate-900">{data.correctCount}</p>
                <p className="text-xs text-slate-500">Correct</p>
              </div>
              <div className="rounded-xl bg-accent-50 p-4 text-center">
                <XCircle className="mx-auto h-5 w-5 text-red-600" aria-hidden="true" />
                <p className="mt-1 text-xl font-bold text-slate-900">{data.incorrectCount}</p>
                <p className="text-xs text-slate-500">Incorrect</p>
              </div>
              <div className="rounded-xl bg-primary-50 p-4 text-center">
                <MinusCircle className="mx-auto h-5 w-5 text-slate-500" aria-hidden="true" />
                <p className="mt-1 text-xl font-bold text-slate-900">{data.unansweredCount}</p>
                <p className="text-xs text-slate-500">Unanswered</p>
              </div>
              <div className="rounded-xl bg-accent-50 p-4 text-center">
                <Clock className="mx-auto h-5 w-5 text-slate-500" aria-hidden="true" />
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatDuration(data.timeTakenSeconds)}
                </p>
                <p className="text-xs text-slate-500">Time taken</p>
              </div>
              <div className="rounded-xl bg-primary-50 p-4 text-center">
                <Calendar className="mx-auto h-5 w-5 text-slate-500" aria-hidden="true" />
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatDate(data.submittedAt)}
                </p>
                <p className="text-xs text-slate-500">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {data.inProgressAttemptId ? (
            <Button asChild>
              <Link href={`/student/quizzes/${data.quizId}/attempt/${data.inProgressAttemptId}`}>
                <RotateCcw className="h-4 w-4 mr-1" aria-hidden="true" />
                Continue In-Progress Attempt
              </Link>
            </Button>
          ) : (
            data.maxAttempts !== null &&
            data.attemptsUsed < data.maxAttempts && (
              <Button asChild>
                <Link href={`/student/quizzes/${data.quizId}/start`}>
                  <RotateCcw className="h-4 w-4 mr-1" aria-hidden="true" />
                  Retake Test
                </Link>
              </Button>
            )
          )}
          <Button asChild variant="outline">
            <Link href={`/student/quizzes/${data.quizId}`}>
              <Award className="h-4 w-4 mr-1" aria-hidden="true" />
              View Attempt History
            </Link>
          </Button>
        </div>

        {/* Answer review */}
        {data.showCorrectAnswers && data.questions ? (
          <Card className="rounded-2xl border-primary-100">
            <CardHeader>
              <CardTitle>Answer Review</CardTitle>
              <CardDescription>
                Review your answers, correct answers and explanations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {data.questions.map((q, i) => {
                const textOf = (optionId: string | null) =>
                  optionId ? (q.options.find((o) => o.id === optionId)?.text ?? optionId) : "—";
                return (
                  <div key={q.id} className="rounded-xl border border-primary-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-slate-900">
                        {i + 1}. {q.question}
                      </p>
                      <Badge variant="neutral" className="shrink-0">{q.marks} pts</Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="w-24 shrink-0 text-slate-500">Your answer:</span>
                        <span
                          className={cn(
                            "flex-1 font-medium",
                            q.isCorrect === true
                              ? "text-emerald-700"
                              : q.isCorrect === false
                                ? "text-red-700"
                                : "text-slate-600"
                          )}
                        >
                          {q.selectedOptionId ? textOf(q.selectedOptionId) : "Not answered"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-24 shrink-0 text-slate-500">Correct:</span>
                        <span className="flex-1 font-medium text-emerald-700">
                          {textOf(q.correctOptionId)}
                        </span>
                      </p>
                      {q.explanation && (
                        <div className="mt-2 flex items-start gap-2 rounded-xl bg-accent-50 p-3 text-slate-700">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
                          <p>
                            <span className="font-semibold">Explanation: </span>
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="py-8 text-center text-sm text-slate-500">
              Answer review is not available for this test.
            </CardContent>
          </Card>
        )}
      </div>
  );
}

