"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeQuizSummary } from "@/lib/office/quizzes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { MoreVertical, ExternalLink, HelpCircle, Clock, AlertCircle, CheckCircle, FileText, Edit2, Eye, Copy } from "lucide-react";
import { useState } from "react";

interface QuizTableProps {
  quizzes: OfficeQuizSummary[];
  canManage: boolean;
  canViewResults: boolean;
}

const typeLabels: Record<string, string> = {
  module: "Module Quiz",
  lesson: "Lesson Quiz",
  final: "Final Test",
};

const statusConfig = {
  published: { label: "Published", variant: "success" as const, icon: CheckCircle },
  draft: { label: "Draft", variant: "neutral" as const, icon: FileText },
} as const;

export function QuizTable({
  quizzes,
  canManage,
  canViewResults,
}: QuizTableProps) {
  const [actionMenu, setActionMenu] = useState<{ quizId: string; x: number; y: number } | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Module</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Questions</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Marks</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempts</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quizzes.map((quiz) => {
              const isPublished = quiz.isPublished;
              const statusCfg = isPublished ? statusConfig.published : statusConfig.draft;
              const typeLabel = typeLabels[quiz.type] ?? quiz.type;

              return (
                <tr key={quiz.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <Link
                      href={`/office/quizzes/${quiz.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600"
                    >
                      {quiz.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-900">{quiz.courseName}</div>
                    {quiz.moduleTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span>→</span>
                        <span>{quiz.moduleTitle}</span>
                        {quiz.lessonTitle && (
                          <>
                            <span>→</span>
                            <span>{quiz.lessonTitle}</span>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="primary">{typeLabel}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-900">{quiz.questionCount}</td>
                  <td className="px-4 py-4 text-sm text-slate-900">{quiz.totalMarks}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {quiz.durationMinutes ? `${quiz.durationMinutes} min` : "No limit"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {quiz.maxAttempts ? `${quiz.maxAttempts}` : "Unlimited"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusCfg.variant} className="gap-1">
                      <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {format(new Date(quiz.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canViewResults && (
                        <Link
                          href={`/office/quizzes/${quiz.id}/results`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
                        >
                          <HelpCircle className="h-4 w-4" aria-hidden="true" />
                          Results
                        </Link>
                      )}
                      <Link
                        href={`/office/quizzes/${quiz.id}/questions`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Questions
                      </Link>
                      <Link
                        href={`/office/quizzes/${quiz.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </Link>
                      {canManage && (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActionMenu({ quizId: quiz.id, x: rect.left, y: rect.bottom });
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {actionMenu?.quizId === quiz.id && (
                            <div
                              className="absolute right-0 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                              role="menu"
                            >
                              <Link
                                role="menuitem"
                                href={`/office/quizzes/${quiz.id}`}
                                onClick={() => setActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                View Details
                              </Link>
                              <Link
                                role="menuitem"
                                href={`/office/quizzes/${quiz.id}/questions`}
                                onClick={() => setActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" aria-hidden="true" />
                                Manage Questions
                              </Link>
                              {canViewResults && (
                                <Link
                                  role="menuitem"
                                  href={`/office/quizzes/${quiz.id}/results`}
                                  onClick={() => setActionMenu(null)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                                  View Results
                                </Link>
                              )}
                              <Link
                                role="menuitem"
                                href={`/office/quizzes/${quiz.id}/edit`}
                                onClick={() => setActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="h-4 w-4" aria-hidden="true" />
                                Edit Quiz
                              </Link>
                              <hr className="my-1 border-slate-200" />
                              <button
                                role="menuitem"
                                onClick={() => handleDuplicate(quiz.id)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Copy className="h-4 w-4" aria-hidden="true" />
                                Duplicate Quiz
                              </button>
                              <hr className="my-1 border-slate-200" />
                              {quiz.isPublished ? (
                                <button
                                  role="menuitem"
                                  onClick={() => handleUnpublish(quiz.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  role="menuitem"
                                  onClick={() => handlePublishCheck(quiz.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                >
                                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                  Publish
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {actionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenu(null)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

async function handlePublishCheck(quizId: string) {
  const res = await fetch(`/api/office/quizzes?action=publish-readiness&quizId=${quizId}`);
  const data = await res.json();
  if (data.ready) {
    const publishRes = await fetch(`/api/office/quizzes/${quizId}`, {
      method: "PATCH",
      body: new URLSearchParams({ isPublished: "true" }),
    });
    if (publishRes.ok) window.location.reload();
  } else {
    alert("Cannot publish: " + data.issues.join(", "));
  }
}

async function handleUnpublish(quizId: string) {
  const res = await fetch(`/api/office/quizzes/${quizId}`, {
    method: "PATCH",
    body: new URLSearchParams({ isPublished: "false" }),
  });
  if (res.ok) window.location.reload();
}

async function handleDuplicate(quizId: string) {
  const res = await fetch("/api/office/quizzes", {
    method: "POST",
    body: new URLSearchParams({ action: "duplicate", quizId }),
  });
  if (res.ok) window.location.reload();
}