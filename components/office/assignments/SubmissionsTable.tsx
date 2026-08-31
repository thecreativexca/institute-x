"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeSubmissionSummary } from "@/lib/office/assignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { MoreVertical, ExternalLink, Clock, AlertCircle, CheckCircle, FileText, Edit2 } from "lucide-react";
import { useState } from "react";

interface SubmissionsTableProps {
  submissions: OfficeSubmissionSummary[];
  canGrade: boolean;
  assignmentMaxScore: number;
}

const statusConfig = {
  submitted: { label: "Submitted", variant: "warning" as const, icon: Clock },
  graded: { label: "Graded", variant: "success" as const, icon: CheckCircle },
} as const;

export function SubmissionsTable({
  submissions,
  canGrade,
  assignmentMaxScore,
}: SubmissionsTableProps) {
  const [actionMenu, setActionMenu] = useState<{ submissionId: string; x: number; y: number } | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Late</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {submissions.map((submission) => {
              const statusCfg = statusConfig[submission.status];
              const isLate = submission.isLate;

              return (
                <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <Link
                        href={`/office/students/${submission.studentId}`}
                        className="font-medium text-slate-900 hover:text-primary-600"
                      >
                        {submission.studentName}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{submission.studentEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {format(new Date(submission.submittedAt), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusCfg.variant} className="gap-1">
                      <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    {isLate ? (
                      <Badge variant="danger" className="gap-1">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        Late
                      </Badge>
                    ) : (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        On Time
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {submission.score !== null ? (
                      <div className="text-sm font-medium text-slate-900">
                        {submission.score} / {assignmentMaxScore}
                        <span className="text-xs text-slate-500 ml-2">
                          ({Math.round((submission.score / assignmentMaxScore) * 100)}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Not graded</span>
                    )}
                    {submission.gradedAt && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Graded {format(new Date(submission.gradedAt), "MMM d, yyyy HH:mm")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/office/assignments/${submission.id}/submissions/${submission.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
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
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActionMenu({ submissionId: submission.id, x: rect.left, y: rect.bottom });
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {actionMenu?.submissionId === submission.id && (
                            <div
                              className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                              role="menu"
                            >
                              <Link
                                role="menuitem"
                                href={`/office/assignments/${submission.id}/submissions/${submission.id}`}
                                onClick={() => setActionMenu(null)}
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