"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";

export function LessonProgressControls({
  courseId,
  lessonId,
  initiallyCompleted,
  previousLessonId,
  nextLessonId,
}: {
  courseId: string;
  lessonId: string;
  initiallyCompleted: boolean;
  previousLessonId: string | null;
  nextLessonId: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initiallyCompleted) return;
    void fetch(`/api/student/lessons/${lessonId}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    }).catch(() => undefined);
  }, [initiallyCompleted, lessonId]);

  function markComplete() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/student/lessons/${lessonId}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to save progress.");
        setCompleted(true);
        setMessage(data.courseCompleted ? "Lesson and course completed." : "Lesson completed.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to save progress.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-card">
      {message ? <p className="mb-3 text-center text-sm font-medium text-primary-800" role="status">{message}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {previousLessonId ? <Link href={`/student/courses/${courseId}/lessons/${previousLessonId}`} className={buttonVariants("outline", "md")}><ChevronLeft className="h-4 w-4" /> Previous lesson</Link> : <span />}
        <Button onClick={markComplete} disabled={completed} isLoading={pending}>
          <CheckCircle2 className="h-4 w-4" /> {completed ? "Completed" : "Mark complete"}
        </Button>
        {nextLessonId ? <Link href={`/student/courses/${courseId}/lessons/${nextLessonId}`} className={buttonVariants("primary", "md")}>Next lesson <ChevronRight className="h-4 w-4" /></Link> : <Link href={`/student/courses/${courseId}`} className={buttonVariants("primary", "md")}>Course overview <ChevronRight className="h-4 w-4" /></Link>}
      </div>
    </div>
  );
}
