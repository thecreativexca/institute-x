"use client";

import type { ReactNode } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const difficultyVariants: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
};

const submissionVariants: Record<
  string,
  "primary" | "success" | "warning" | "danger" | "neutral"
> = {
  not_started: "neutral",
  in_progress: "primary",
  submitted: "primary",
  under_review: "primary",
  changes_required: "warning",
  approved: "success",
  completed: "success",
};

function formatDate(value?: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

interface OfficeProjectCardProps {
  project: any;
  submissions: any[];
  onReview: (submission: any, totalMarks: number) => void;
}

export function OfficeProjectCard({
  project,
  submissions,
  onReview,
}: OfficeProjectCardProps) {
  const pendingReviews = submissions.filter((s) =>
    ["submitted", "under_review"].includes(s.status),
  ).length;
  const approvedCount = submissions.filter((s) =>
    ["approved", "completed"].includes(s.status),
  ).length;

  return (
    <Card className="overflow-hidden rounded-2xl border-primary-100 shadow-card">
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent-400 to-primary-500" />
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <FolderKanban className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  {project.title}
                </h2>
                <Badge variant="primary">{project.status}</Badge>
                <Badge
                  variant={difficultyVariants[project.difficulty] ?? "neutral"}
                  className="capitalize"
                >
                  {project.difficulty}
                </Badge>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                {project.course?.name ||
                  project.internship?.title ||
                  "Selected students"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MetaChip icon={Star}>{project.totalMarks} marks</MetaChip>
                <MetaChip icon={Calendar}>{formatDate(project.dueDate)}</MetaChip>
                <MetaChip icon={Users}>
                  {submissions.length} submission{submissions.length === 1 ? "" : "s"}
                </MetaChip>
                {pendingReviews > 0 ? (
                  <Badge variant="warning" className="gap-1">
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                    {pendingReviews} pending review
                  </Badge>
                ) : null}
                {approvedCount > 0 ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    {approvedCount} approved
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {submissions.length ? (
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            {submissions.map((submission) => (
              <div
                key={submission._id}
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="mr-auto text-sm font-medium text-slate-900">
                    {submission.student?.name}
                  </p>
                  <Badge
                    variant={submissionVariants[submission.status] ?? "neutral"}
                    className="capitalize"
                  >
                    {formatStatus(submission.status)}
                  </Badge>
                  {submission.score != null ? (
                    <span className="text-xs font-semibold text-primary-700">
                      {submission.score}/{project.totalMarks}
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant={
                      ["submitted", "under_review"].includes(submission.status)
                        ? "primary"
                        : "outline"
                    }
                    onClick={() => onReview(submission, project.totalMarks)}
                  >
                    Review
                  </Button>
                </div>

                {submission.text || submission.githubUrl || submission.liveUrl || submission.otherUrl ? (
                  <details className="mt-3 rounded-lg border border-white bg-white p-3 text-xs text-slate-600">
                    <summary className="cursor-pointer font-medium text-primary-700">
                      View submission details
                    </summary>
                    <div className="mt-2 space-y-2 whitespace-pre-line">
                      {submission.text ? <p>{submission.text}</p> : null}
                      {submission.githubUrl ? (
                        <SubmissionLink label="GitHub" href={submission.githubUrl} />
                      ) : null}
                      {submission.liveUrl ? (
                        <SubmissionLink label="Live demo" href={submission.liveUrl} />
                      ) : null}
                      {submission.otherUrl ? (
                        <SubmissionLink label="Other link" href={submission.otherUrl} />
                      ) : null}
                    </div>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No submissions yet. Students will appear here once they submit work.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: typeof Clock3;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      {children}
    </span>
  );
}

function SubmissionLink({ label, href }: { label: string; href: string }) {
  return (
    <p className="flex items-center gap-1.5">
      <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      <span className="font-medium text-slate-700">{label}:</span>
      <a
        className="truncate text-primary-700 underline-offset-2 hover:underline"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {href}
      </a>
    </p>
  );
}
