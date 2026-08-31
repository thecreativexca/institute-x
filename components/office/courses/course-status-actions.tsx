"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  publishCourseAction,
  unpublishCourseAction,
  archiveCourseAction,
  restoreCourseToDraftAction,
  deleteCourseAction,
} from "@/lib/office/courses/actions";
import type { OfficeCourseStatus } from "@/lib/office/courses/dto";

interface CourseStatusActionsProps {
  courseId: string;
  courseName: string;
  status: OfficeCourseStatus;
  canPublish: boolean;
  canUpdate: boolean;
  enrollmentCount: number;
  compact?: boolean;
}

type PendingAction = "publish" | "unpublish" | "archive" | "restore" | "delete" | null;

const CONFIRMATIONS: Record<
  Exclude<PendingAction, null>,
  { title: string; description: string }
> = {
  publish: {
    title: "Publish course",
    description:
      "Published course may become visible to students/public users. A readiness check runs before publishing.",
  },
  unpublish: {
    title: "Unpublish course",
    description:
      "The course will move back to draft and disappear from public discovery. Existing enrolled students keep their access.",
  },
  archive: {
    title: "Archive course",
    description:
      "The course will be hidden from new students. Historical records (enrollments, progress, certificates) are preserved.",
  },
  restore: {
    title: "Restore to draft",
    description:
      "The archived course returns to draft. Publish again (with a readiness check) when it should be public.",
  },
  delete: {
    title: "Delete draft course",
    description:
      "This permanently deletes the draft course and its modules/lessons. Only possible when no students, payments or progress records exist.",
  },
};

/**
 * Permission-aware status transition buttons with explicit confirmation
 * (req. 20–21, 73, 98, 100). The server action re-checks permission.
 */
export function CourseStatusActions({
  courseId,
  courseName,
  status,
  canPublish,
  canUpdate,
  enrollmentCount,
  compact = false,
}: CourseStatusActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState("");
  const [isRunning, startTransition] = useTransition();

  const size = compact ? "sm" : "md";

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Action failed.");
        return;
      }
      setPending(null);
      router.refresh();
    });
  }

  const confirm = CONFIRMATIONS[pending as Exclude<PendingAction, null>];

  return (
    <>
      <div className={compact ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
        {status === "draft" && canPublish && (
          <Button size={size} onClick={() => setPending("publish")}>
            Publish
          </Button>
        )}
        {status === "published" && canPublish && (
          <Button size={size} variant="outline" onClick={() => setPending("unpublish")}>
            Unpublish
          </Button>
        )}
        {status === "archived" && canUpdate && (
          <Button size={size} variant="outline" onClick={() => setPending("restore")}>
            Restore to draft
          </Button>
        )}
        {status !== "archived" && canPublish && (
          <Button size={size} variant="ghost" onClick={() => setPending("archive")}>
            Archive
          </Button>
        )}
        {status === "draft" && canUpdate && (
          <Button size={size} variant="ghost" onClick={() => setPending("delete")}>
            Delete
          </Button>
        )}
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={
          pending === "publish" ? `Publish ${courseName}?` : (confirm?.title ?? "")
        }
        description={confirm?.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant={pending === "delete" ? "danger" : "primary"}
              isLoading={isRunning}
              onClick={() => {
                if (pending === "publish") run(() => publishCourseAction(courseId));
                else if (pending === "unpublish") run(() => unpublishCourseAction(courseId));
                else if (pending === "archive") run(() => archiveCourseAction(courseId));
                else if (pending === "restore") run(() => restoreCourseToDraftAction(courseId));
                else if (pending === "delete") run(() => deleteCourseAction(courseId));
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        {pending === "unpublish" || pending === "archive" ? (
          <p className="text-sm text-slate-600">
            {enrollmentCount} enrolled student(s) will keep their existing access.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
