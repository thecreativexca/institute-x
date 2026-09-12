"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeAssignmentSummary } from "@/lib/office/assignments";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { Clock, AlertCircle, CheckCircle, FileText, MoreVertical, Edit2, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AssignmentCardProps {
  assignment: OfficeAssignmentSummary;
  canManage: boolean;
}

const statusConfig = {
  published: { label: "Published", variant: "success" as const, icon: CheckCircle },
  draft: { label: "Draft", variant: "neutral" as const, icon: FileText },
} as const;

export function AssignmentCard({ assignment, canManage }: AssignmentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPublished = assignment.isPublished;
  const statusCfg = isPublished ? statusConfig.published : statusConfig.draft;
  const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const isOverdue = dueAt && dueAt < new Date() && !isPublished === false;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:border-primary-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/office/assignments/${assignment.id}`}
            className="font-medium text-slate-900 hover:text-primary-600 block truncate"
          >
            {assignment.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{assignment.courseName}</span>
            {assignment.moduleTitle && (
              <>
                <span>→</span>
                <span>{assignment.moduleTitle}</span>
                {assignment.lessonTitle && (
                  <>
                    <span>→</span>
                    <span>{assignment.lessonTitle}</span>
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
            {dueAt && (
              <span className={cn("flex items-center gap-1", isOverdue && "text-red-600")}>
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {format(dueAt, "MMM d, yyyy HH:mm")}
                {isOverdue && <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
              </span>
            )}
            <span className="text-slate-600">Max: {assignment.maxScore}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-600">Submissions: {assignment.totalSubmissions}</span>
            {assignment.pendingReviews > 0 && (
              <Badge variant="warning" className="gap-1">
                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                {assignment.pendingReviews} pending
              </Badge>
            )}
            {assignment.gradedSubmissions > 0 && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-2.5 w-2.5" aria-hidden="true" />
                {assignment.gradedSubmissions} graded
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/office/assignments/${assignment.id}/submissions`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Submissions
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
                  className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                  role="menu"
                >
                  <Link
                    role="menuitem"
                    href={`/office/assignments/${assignment.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    View Details
                  </Link>
                  <Link
                    role="menuitem"
                    href={`/office/assignments/${assignment.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" aria-hidden="true" />
                    Edit Assignment
                  </Link>
                  <hr className="my-1 border-slate-200" />
                  {assignment.isPublished ? (
                    <button
                      role="menuitem"
                      onClick={() => handleUnpublish(assignment.id)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      Unpublish
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      onClick={() => handlePublish(assignment.id)}
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
      </div>
    </div>
  );
}

async function handlePublish(assignmentId: string) {
  const res = await fetch(`/api/office/assignments/${assignmentId}`, {
    method: "PATCH",
    body: new URLSearchParams({ isPublished: "true" }),
  });
  if (res.ok) window.location.reload();
}

async function handleUnpublish(assignmentId: string) {
  const res = await fetch(`/api/office/assignments/${assignmentId}`, {
    method: "PATCH",
    body: new URLSearchParams({ isPublished: "false" }),
  });
  if (res.ok) window.location.reload();
}
