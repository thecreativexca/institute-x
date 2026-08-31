"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeSubmissionSummary } from "@/lib/office/assignments";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle, FileText, MoreVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SubmissionCardProps {
  submission: OfficeSubmissionSummary;
  canGrade: boolean;
  assignmentMaxScore: number;
}

const statusConfig = {
  submitted: { label: "Submitted", variant: "warning" as const, icon: Clock },
  graded: { label: "Graded", variant: "success" as const, icon: CheckCircle },
} as const;

export function SubmissionCard({ submission, canGrade, assignmentMaxScore }: SubmissionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLate = submission.isLate;
  const statusCfg = statusConfig[submission.status];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:border-primary-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/office/students/${submission.studentId}`}
            className="font-medium text-slate-900 hover:text-primary-600 block truncate"
          >
            {submission.studentName}
          </Link>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{submission.studentEmail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-600">Submitted: {format(new Date(submission.submittedAt), "MMM d, yyyy HH:mm")}</span>
            <Badge variant={statusCfg.variant} className="gap-1">
              <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
              {statusCfg.label}
            </Badge>
            {isLate && (
              <Badge variant="danger" className="gap-1">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                Late
              </Badge>
            )}
          </div>
          <div className="mt-2 text-sm">
            {submission.score !== null ? (
              <span className="font-medium text-slate-900">
                Score: {submission.score} / {assignmentMaxScore}
                ({Math.round((submission.score / assignmentMaxScore) * 100)}%)
              </span>
            ) : (
              <span className="text-slate-500">Not graded yet</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/office/assignments/${submission.id}/submissions/${submission.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Review
          </Link>
          {canGrade && submission.status === "submitted" && (
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
                    href={`/office/assignments/${submission.id}/submissions/${submission.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Review & Grade
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
