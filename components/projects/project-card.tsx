import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock3,
  FolderKanban,
  GraduationCap,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";

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

function formatStatus(status?: string) {
  return (status || "not started").replace(/_/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

interface StudentProjectCardProps {
  row: any;
}

export function StudentProjectCard({ row }: StudentProjectCardProps) {
  const status = row.submission?.status;
  const overdue =
    row.dueDate &&
    new Date(row.dueDate) < new Date() &&
    !["approved", "completed", "submitted", "under_review"].includes(
      status ?? "",
    );
  const scorePercent =
    row.submission?.score != null && row.totalMarks
      ? Math.round((row.submission.score / row.totalMarks) * 100)
      : null;

  return (
    <Card
      className="group flex h-full flex-col overflow-hidden rounded-2xl border-primary-100 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
    >
      <div className="h-1.5 bg-gradient-to-r from-accent-400 via-primary-400 to-accent-400" />
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <FolderKanban className="h-5 w-5" aria-hidden="true" />
          </span>
          <Badge variant={submissionVariants[status ?? "not_started"] ?? "neutral"}>
            {formatStatus(status)}
          </Badge>
        </div>

        <h2 className="mt-4 text-base font-semibold leading-snug text-slate-900">
          {row.title}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {row.internship?.title || row.course?.name || "Direct assignment"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={difficultyVariants[row.difficulty] ?? "neutral"} className="capitalize">
            {row.difficulty}
          </Badge>
          <MetaChip icon={Calendar} className={overdue ? "text-red-700 bg-red-50" : undefined}>
            {overdue ? "Overdue · " : ""}
            {formatDate(row.dueDate)}
          </MetaChip>
          <MetaChip icon={Star}>
            {row.totalMarks} marks
          </MetaChip>
        </div>

        {scorePercent != null ? (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Score</span>
              <span className="font-semibold text-primary-700">
                {row.submission.score}/{row.totalMarks}
              </span>
            </div>
            <Progress value={scorePercent} />
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/student/projects/${row._id}`}>
              Open project
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetaChip({
  icon: Icon,
  children,
  className,
}: {
  icon: typeof Clock3;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      {children}
    </span>
  );
}
