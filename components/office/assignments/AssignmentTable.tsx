"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeAssignmentSummary } from "@/lib/office/assignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { MoreVertical, ExternalLink, Clock, AlertCircle, CheckCircle, XCircle, Edit2, Eye, FileText } from "lucide-react";
import { useState } from "react";

interface AssignmentTableProps {
  assignments: OfficeAssignmentSummary[];
  canManage: boolean;
  canGrade: boolean;
}

const statusConfig = {
  published: { label: "Published", variant: "success" as const, icon: CheckCircle },
  draft: { label: "Draft", variant: "neutral" as const, icon: FileText },
} as const;

export function AssignmentTable({
  assignments,
  canManage,
  canGrade,
}: AssignmentTableProps) {
  const [actionMenu, setActionMenu] = useState<{ assignmentId: string; x: number; y: number } | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course / Module</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Max Marks</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submissions</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {assignments.map((assignment) => {
              const isPublished = assignment.isPublished;
              const statusCfg = isPublished ? statusConfig.published : statusConfig.draft;
              const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
              const isOverdue = dueAt && dueAt < new Date() && !isPublished === false;

              return (
                <tr key={assignment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <Link
                      href={`/office/assignments/${assignment.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600"
                    >
                      {assignment.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-900">{assignment.courseName}</div>
                    {assignment.moduleTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span>→</span>
                        <span>{assignment.moduleTitle}</span>
                        {assignment.lessonTitle && (
                          <>
                            <span>→</span>
                            <span>{assignment.lessonTitle}</span>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {dueAt ? (
                      <div className={cn("text-sm", isOverdue && "text-red-600 font-medium")}>
                        <Clock className="h-3.5 w-3.5 inline mr-1" aria-hidden="true" />
                        {format(dueAt, "MMM d, yyyy HH:mm")}
                        {isOverdue && <AlertCircle className="h-3.5 w-3.5 inline ml-1" aria-hidden="true" />}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No deadline</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-900">{assignment.maxScore}</td>
                  <td className="px-4 py-4">
                    <Badge variant={statusCfg.variant} className="gap-1">
                      <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-900">Total: {assignment.totalSubmissions}</span>
                      <div className="flex gap-2">
                        {assignment.pendingReviews > 0 && (
                          <Badge variant="warning" className="gap-1 text-xs">
                            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                            {assignment.pendingReviews} pending
                          </Badge>
                        )}
                        {assignment.gradedSubmissions > 0 && (
                          <Badge variant="success" className="gap-1 text-xs">
                            <CheckCircle className="h-2.5 w-2.5" aria-hidden="true" />
                            {assignment.gradedSubmissions} graded
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {format(new Date(assignment.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/office/assignments/${assignment.id}/submissions`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Submissions
                      </Link>
                      <Link
                        href={`/office/assignments/${assignment.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </Link>
                      {(canManage || canGrade) && (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActionMenu({ assignmentId: assignment.id, x: rect.left, y: rect.bottom });
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {actionMenu?.assignmentId === assignment.id && (
                            <div
                              className="absolute right-0 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                              role="menu"
                            >
                              <Link
                                role="menuitem"
                                href={`/office/assignments/${assignment.id}`}
                                onClick={() => setActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                View Details
                              </Link>
                              <Link
                                role="menuitem"
                                href={`/office/assignments/${assignment.id}/submissions`}
                                onClick={() => setActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" aria-hidden="true" />
                                View Submissions
                              </Link>
                              {canManage && (
                                <>
                                  <Link
                                    role="menuitem"
                                    href={`/office/assignments/${assignment.id}/edit`}
                                    onClick={() => setActionMenu(null)}
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
                                      <XCircle className="h-4 w-4" aria-hidden="true" />
                                      Unpublish
                                    </button>
                                  ) : (
                                    <button
                                      role="menuitem"
                                      onClick={() => handlePublish(assignment.id)}
                                      className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                      Publish
                                    </button>
                                  )}
                                </>
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