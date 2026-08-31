"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import type { QuizSummaryListItem } from "@/lib/quizzes/types";
import {
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  ListChecks,
  RotateCcw,
  Lock,
  PlayCircle,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  module: "Module Test",
  lesson: "Lesson Quiz",
  final: "Final Test",
};

function formatMarks(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `${v}%`;
}

export function StudentQuizzesClient({
  quizzes,
}: {
  quizzes: QuizSummaryListItem[];
  }) {
  return (
      <div className="space-y-6">
        <StudentPageHeader
          title="Quizzes & Tests"
          description="Take assessments, continue active attempts and review your best results."
          icon={<HelpCircle className="h-6 w-6" aria-hidden="true" />}
          eyebrow="Knowledge checks"
        />

        {quizzes.length === 0 ? (
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="pt-6">
              <EmptyState
                icon={<HelpCircle className="h-12 w-12" aria-hidden="true" />}
                title="No tests are available yet"
                description="Quizzes will appear here once published for your enrolled courses."
                action={
                  <Button asChild>
                    <Link href="/student/courses">
                      Continue Learning <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {quizzes.map((quiz) => {
              const hasInProgress = !!quiz.inProgressAttemptId;
              const blocked = !quiz.canAttempt;
              const viewHref = quiz.latestSubmittedAttemptId
                ? `/student/quizzes/${quiz.id}/result/${quiz.latestSubmittedAttemptId}`
                : null;

              return (
                <Card key={quiz.id} className="flex flex-col rounded-2xl border-primary-100 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">{TYPE_LABELS[quiz.type] ?? quiz.type}</Badge>
                      {quiz.availability === "upcoming" && (
                        <Badge variant="warning">Not started yet</Badge>
                      )}
                      {quiz.availability === "expired" && (
                        <Badge variant="danger">Closed</Badge>
                      )}
                      {blocked && hasInProgress && (
                        <Badge variant="primary">In progress</Badge>
                      )}
                      {quiz.maxAttempts !== null && !hasInProgress && !blocked && (
                        <Badge variant="neutral">
                          {quiz.attemptsUsed}/{quiz.maxAttempts} attempts
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{quiz.title}</CardTitle>
                    {quiz.description ? (
                      <CardDescription className="line-clamp-2">{quiz.description}</CardDescription>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        {quiz.courseTitle}
                      </span>
                      {quiz.moduleTitle && (
                        <span className="inline-flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" aria-hidden="true" />
                          {quiz.moduleTitle}
                        </span>
                      )}
                      {quiz.lessonTitle && (
                        <span className="inline-flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" aria-hidden="true" />
                          {quiz.lessonTitle}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div className="rounded-xl bg-primary-50 p-3 text-center">
                        <p className="flex items-center justify-center gap-1 text-lg font-bold text-slate-900">
                          <ListChecks className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {quiz.questionCount}
                        </p>
                        <p className="text-xs text-slate-500">Questions</p>
                      </div>
                      <div className="rounded-xl bg-accent-50 p-3 text-center">
                        <p className="text-lg font-bold text-slate-900">{quiz.totalMarks}</p>
                        <p className="text-xs text-slate-500">Marks</p>
                      </div>
                      <div className="rounded-xl bg-primary-50 p-3 text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {quiz.passingPercentage}%
                        </p>
                        <p className="text-xs text-slate-500">Passing</p>
                      </div>
                      <div className="rounded-xl bg-accent-50 p-3 text-center">
                        <p className="flex items-center justify-center gap-1 text-lg font-bold text-slate-900">
                          <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {quiz.durationMinutes ?? "∞"}
                        </p>
                        <p className="text-xs text-slate-500">Minutes</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {quiz.bestPercentage !== null && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                          <Award className="h-4 w-4" aria-hidden="true" />
                          Best score: {formatMarks(quiz.bestPercentage)}
                        </span>
                      )}
                      {quiz.inProgressAttemptId && (
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <PlayCircle className="h-4 w-4" aria-hidden="true" />
                          Attempt in progress
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {blocked ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
                          <Lock className="h-4 w-4" aria-hidden="true" />
                          {quiz.blockReason ?? "Not available"}
                        </span>
                      ) : hasInProgress ? (
                        <Button asChild>
                          <Link href={`/student/quizzes/${quiz.id}/attempt/${quiz.inProgressAttemptId}`}>
                            <PlayCircle className="h-4 w-4" aria-hidden="true" />
                            Continue Test
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link href={`/student/quizzes/${quiz.id}/start`}>
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            Start Test
                          </Link>
                        </Button>
                      )}
                      {viewHref && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={viewHref}>
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            View Result
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
  );
}

