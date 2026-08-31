"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeQuizSummary } from "@/lib/office/quizzes";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit2, Eye, Copy, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuizCardProps {
  quiz: OfficeQuizSummary;
  canManage: boolean;
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

export function QuizCard({ quiz, canManage }: QuizCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPublished = quiz.isPublished;
  const statusCfg = isPublished ? statusConfig.published : statusConfig.draft;
  const typeLabel = typeLabels[quiz.type] ?? quiz.type;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:border-primary-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/office/quizzes/${quiz.id}`}
            className="font-medium text-slate-900 hover:text-primary-600 block truncate"
          >
            {quiz.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Badge variant="primary">{typeLabel}</Badge>
            <span>{quiz.courseName}</span>
            {quiz.moduleTitle && (
              <>
                <span>→</span>
                <span>{quiz.moduleTitle}</span>
                {quiz.lessonTitle && (
                  <>
                    <span>→</span>
                    <span>{quiz.lessonTitle}</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={statusCfg.variant} className="gap-1">
              <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
              {statusCfg.label}
            </Badge>
            <span className="text-slate-600">Questions: {quiz.questionCount}</span>
            <span className="text-slate-600">Marks: {quiz.totalMarks}</span>
            <span className="text-slate-600">
              {quiz.durationMinutes ? `${quiz.durationMinutes} min` : "No limit"}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Attempts: {quiz.attemptCount} • Updated {format(new Date(quiz.updatedAt), "MMM d, yyyy")}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/office/quizzes/${quiz.id}/questions`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Questions
          </Link>
          {canManage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                  role="menu"
                >
                  <Link
                    role="menuitem"
                    href={`/office/quizzes/${quiz.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    View Details
                  </Link>
                  <Link
                    role="menuitem"
                    href={`/office/quizzes/${quiz.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" aria-hidden="true" />
                    Edit Quiz
                  </Link>
                  <Link
                    role="menuitem"
                    href={`/office/quizzes/${quiz.id}/questions`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Manage Questions
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
                      className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
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
      </div>
    </div>
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
