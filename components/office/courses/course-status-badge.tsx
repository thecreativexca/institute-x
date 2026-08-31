import { cn } from "@/lib/utils/cn";
import type { OfficeCourseStatus } from "@/lib/office/courses/dto";

const STATUS_STYLES: Record<OfficeCourseStatus, string> = {
  draft: "bg-amber-50 text-amber-800 border-amber-200",
  published: "bg-green-50 text-green-800 border-green-200",
  archived: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<OfficeCourseStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

/** Status badge that never relies on color alone (req. 111) — always labeled. */
export function CourseStatusBadge({
  status,
  className,
}: {
  status: OfficeCourseStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ContentStatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        published
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
