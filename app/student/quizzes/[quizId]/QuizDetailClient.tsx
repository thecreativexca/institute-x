"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import type { QuizDetailViewData } from "@/lib/quizzes/types";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  ListChecks,
  Award,
  ShieldCheck,
  Lock,
  PlayCircle,
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

export function QuizDetailClient({
  detail,
  blockReason,
}: {
  detail: QuizDetailViewData | null;
  blockReason?: string;
  }) {
  return (
      <div className="space-y-6">
        <Link
          href="/student/quizzes"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Quizzes
        </Link>

        {!detail ? (
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertTitle>Test unavailable</AlertTitle>
                <AlertDescription>
                  {blockReason ?? "This test is not available to you."}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/student/quizzes">
                    <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                    Back to Quizzes
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="student-page-header">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">{TYPE_LABELS[detail.type] ?? detail.type}</Badge>
                {detail.availability === "upcoming" && <Badge variant="warning">Not available yet</Badge>}
                {detail.availability === "expired" && <Badge variant="danger">Closed</Badge>}
                {detail.inProgressAttemptId && <Badge variant="primary">Attempt in progress</Badge>}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{detail.title}</h1>
              <p className="mt-2 text-slate-600">{detail.description ?? ""}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary-600" aria-hidden="true" /> {detail.courseTitle}
                </span>
                {detail.moduleTitle && <span>· {detail.moduleTitle}</span>}
                {detail.lessonTitle && <span>· {detail.lessonTitle}</span>}
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="rounded-2xl border-primary-100 bg-primary-50/40">
                <CardContent className="pt-6 text-center">
                  <p className="flex items-center justify-center gap-1 text-2xl font-bold text-slate-900">
                    <ListChecks className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    {detail.questionCount}
                  </p>
                  <p className="text-sm text-slate-500">Questions</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary-100 bg-accent-50/50">
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-slate-900">{detail.totalMarks}</p>
                  <p className="text-sm text-slate-500">Total Marks</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary-100 bg-primary-50/40">
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-slate-900">{detail.passingPercentage}%</p>
                  <p className="text-sm text-slate-500">Passing</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary-100 bg-accent-50/50">
                <CardContent className="pt-6 text-center">
                  <p className="flex items-center justify-center gap-1 text-2xl font-bold text-slate-900">
                    <Clock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    {detail.durationMinutes ?? "∞"}
                  </p>
                  <p className="text-sm text-slate-500">Minutes</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary-100 bg-primary-50/40">
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {detail.maxAttempts === null ? "∞" : detail.maxAttempts}
                  </p>
                  <p className="text-sm text-slate-500">Max Attempts</p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-primary-100">
              <CardHeader>
                <CardTitle>Important Instructions</CardTitle>
                <CardDescription>Please read carefully before starting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                  The timer starts when you begin the test and cannot be paused or extended.
                </p>
                <p className="flex items-start gap-2">
                  <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                  {detail.questionCount} questions · {detail.totalMarks} marks · passing score{" "}
                  {detail.passingPercentage}%.
                </p>
                <p className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                  {detail.durationMinutes
                    ? `You have ${detail.durationMinutes} minutes to complete the test.`
                    : "There is no time limit for this test."}
                </p>
                <p className="flex items-start gap-2">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                  Best score so far: {detail.bestPercentage !== null ? `${detail.bestPercentage}%` : "—"}.
                </p>
                {detail.instructions && (
                  <p className="mt-2 whitespace-pre-line border-t border-slate-100 pt-3 text-slate-600">
                    {detail.instructions}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  {detail.inProgressAttemptId ? (
                    <>
                      You have an attempt in progress
                      {detail.inProgressRemainingSeconds !== null && (
                        <> (about {Math.ceil(detail.inProgressRemainingSeconds / 60)} min left)</>
                      )}
                      .
                    </>
                  ) : detail.maxAttempts !== null ? (
                    <>
                      Attempts used: {detail.attemptsUsed} of {detail.maxAttempts}
                    </>
                  ) : (
                    <>Attempts used: {detail.attemptsUsed} (unlimited)</>
                  )}
                </div>
                {detail.canAttempt &&
                  (detail.inProgressAttemptId ? (
                    <Button asChild>
                      <Link href={`/student/quizzes/${detail.id}/attempt/${detail.inProgressAttemptId}`}>
                        <PlayCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        Continue Test
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href={`/student/quizzes/${detail.id}/start`}>
                        <PlayCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                        Start Test
                      </Link>
                    </Button>
                  ))}
                {!detail.canAttempt && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    {detail.blockReason ?? "Not available"}
                  </span>
                )}
              </div>
            </div>


            <Card className="rounded-2xl border-primary-100">
              <CardHeader>
                <CardTitle>Attempt History</CardTitle>
                <CardDescription>All your submitted attempts for this test</CardDescription>
              </CardHeader>
              <CardContent>
                {detail.history.length === 0 ? (
                  <EmptyState
                    icon={<Award className="h-10 w-10" aria-hidden="true" />}
                    title="No attempts yet"
                    description="Your test attempts will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                          <th className="py-2 pr-4 font-medium">Attempt</th>
                          <th className="py-2 pr-4 font-medium">Date</th>
                          <th className="py-2 pr-4 font-medium">Score</th>
                          <th className="py-2 pr-4 font-medium">Percentage</th>
                          <th className="py-2 pr-4 font-medium">Result</th>
                          <th className="py-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.history.map((h) => (
                          <tr key={h.attemptId} className="border-b border-slate-100">
                            <td className="py-3 pr-4 font-medium text-slate-900">
                              Attempt #{h.attemptNumber}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">{formatDate(h.submittedAt)}</td>
                            <td className="py-3 pr-4 text-slate-600">
                              {h.score}/{h.totalMarks}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">{h.percentage}%</td>
                            <td className="py-3 pr-4">
                              {h.passed ? (
                                <Badge variant="success">Passed</Badge>
                              ) : h.status === "expired" ? (
                                <Badge variant="warning">Expired</Badge>
                              ) : (
                                <Badge variant="danger">Failed</Badge>
                              )}
                            </td>
                            <td className="py-3">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/student/quizzes/${detail.id}/result/${h.attemptId}`}>
                                  View Result
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
  );
}

