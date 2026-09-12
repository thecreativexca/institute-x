"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeAssignmentDetail } from "@/lib/office/assignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { Clock, AlertCircle, CheckCircle, FileText, Edit2, ExternalLink, MoreVertical } from "lucide-react";
import { useState } from "react";

interface AssignmentDetailProps {
  assignment: OfficeAssignmentDetail;
  canManage: boolean;
  canGrade: boolean;
}

const statusConfig = {
  published: { label: "Published", variant: "success" as const, icon: CheckCircle },
  draft: { label: "Draft", variant: "neutral" as const, icon: FileText },
} as const;

export function AssignmentDetail({ assignment, canManage, canGrade }: AssignmentDetailProps) {
  const [actionMenu, setActionMenu] = useState<{ x: number; y: number } | null>(null);
  const isPublished = assignment.isPublished;
  const statusCfg = isPublished ? statusConfig.published : statusConfig.draft;
  const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const isOverdue = dueAt && dueAt < new Date() && !isPublished === false;

  const handlePublish = async () => {
    const res = await fetch(`/api/office/assignments/${assignment.id}`, {
      method: "PATCH",
      body: new URLSearchParams({ isPublished: "true" }),
    });
    if (res.ok) window.location.reload();
  };

  const handleUnpublish = async () => {
    const res = await fetch(`/api/office/assignments/${assignment.id}`, {
      method: "PATCH",
      body: new URLSearchParams({ isPublished: "false" }),
    });
    if (res.ok) window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant={statusCfg.variant} className="gap-1 text-sm">
            <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
            {statusCfg.label}
          </Badge>
          <span className="text-sm text-slate-500">
            {assignment.courseName}
            {assignment.moduleTitle && ` → ${assignment.moduleTitle}`}
            {assignment.lessonTitle && ` → ${assignment.lessonTitle}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/office/assignments/${assignment.id}/submissions`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            View Submissions ({assignment.totalSubmissions})
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
                  setActionMenu({ x: rect.left, y: rect.bottom });
                }}
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
              {actionMenu && (
                <div
                  className="absolute right-0 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                  role="menu"
                >
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
                  {isPublished ? (
                    <button
                      role="menuitem"
                      onClick={handleUnpublish}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      Unpublish
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      onClick={handlePublish}
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

      {/* Assignment Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            {dueAt ? (
              <div className={cn("text-lg font-semibold", isOverdue && "text-red-600")}>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <span>{format(dueAt, "MMM d, yyyy 'at' HH:mm")}</span>
                  {isOverdue && <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />}
                </div>
                {isOverdue && <p className="mt-1 text-sm text-red-600">Deadline has passed</p>}
              </div>
            ) : (
              <p className="text-slate-400">No deadline set</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Maximum Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{assignment.maxScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total</span>
                <span className="font-medium text-slate-900">{assignment.totalSubmissions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Pending Review</span>
                <span className="font-medium text-amber-600">{assignment.pendingReviews}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Graded</span>
                <span className="font-medium text-amber-700">{assignment.gradedSubmissions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate max-w-none whitespace-pre-wrap">{assignment.instructions}</div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Created</dt>
              <dd className="text-sm text-slate-900">{format(new Date(assignment.createdAt), "MMM d, yyyy HH:mm")}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Last Updated</dt>
              <dd className="text-sm text-slate-900">{format(new Date(assignment.updatedAt), "MMM d, yyyy HH:mm")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}