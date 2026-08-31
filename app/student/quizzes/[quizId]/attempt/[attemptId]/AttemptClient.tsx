"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AttemptViewData } from "@/lib/quizzes/types";
import { cn } from "@/lib/utils/cn";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  CheckCircle2,
  Circle,
  XCircle,
  Loader2,
} from "lucide-react";

const SAVE_DEBOUNCE_MS = 1200;

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function AttemptClient({ data }: { data: AttemptViewData }) {
  const router = useRouter();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(data.answers);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(
    data.deadlineAt === null ? null : Math.max(0, data.deadlineAt - data.serverNow)
  );

  const dirtyRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);

  const totalQuestions = data.totalQuestions;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.length > 0).length,
    [answers]
  );
  const unansweredCount = totalQuestions - answeredCount;

  // ---------- Submit ----------
  const flushSave = useCallback(async () => {
    if (dirtyRef.current.size === 0) return;
    const pending = Array.from(dirtyRef.current);
    dirtyRef.current = new Set();
    setSaveState("saving");
    try {
      for (const questionId of pending) {
        const selected = answers[questionId];
        if (!selected) continue;
        const res = await fetch(
          `/api/student/quizzes/${data.quizId}/attempt/${data.attemptId}/answer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attemptId: data.attemptId,
              questionId,
              selectedOptionId: selected,
            }),
          }
        );
        if (!res.ok) {
          dirtyRef.current.add(questionId);
          setSaveState("error");
          return;
        }
      }
      setSaveState("saved");
    } catch {
      for (const id of pending) dirtyRef.current.add(id);
      setSaveState("error");
    }
  }, [answers, data.quizId, data.attemptId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Flush on tab hide / before unload to avoid losing answers.
  useEffect(() => {
    const onHide = () => {
      if (dirtyRef.current.size > 0) {
        void flushSave();
      }
    };
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flushSave]);

  const selectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    dirtyRef.current.add(questionId);
    setSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
  };

  // ---------- Submit ----------
  const submit = useCallback(
    async (reason: "manual" | "expired") => {
      if (submittedRef.current) return;
      submittedRef.current = true;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await flushSave();

      setSubmitting(true);
      try {
        const res = await fetch(
          `/api/student/quizzes/${data.quizId}/attempt/${data.attemptId}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }
        );
        const result = await res.json();
        if (!res.ok) {
          setFatalError(result.error || "Unable to submit the test.");
          setSubmitting(false);
          submittedRef.current = false;
          return;
        }
        router.replace(
          `/student/quizzes/${data.quizId}/result/${data.attemptId}`
        );
        router.refresh();
      } catch {
        setFatalError("Unable to submit the test. Please try again.");
        setSubmitting(false);
        submittedRef.current = false;
      }
    },
    [data.quizId, data.attemptId, flushSave, router]
  );

  // ---------- Timer ----------
  useEffect(() => {
    // Capture the deadline so the closure keeps the narrowed type.
    const deadline = data.deadlineAt;
    if (deadline === null) return;

    const tick = () => {
      const remaining = deadline - Date.now();
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0) {
        void submit("expired");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data.deadlineAt, submit]);

  // ---------- Render ----------
  if (fatalError) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert variant="destructive">
          <AlertDescription>{fatalError}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <a href={`/student/quizzes/${data.quizId}`}>Back to Test</a>
          </Button>
        </div>
      </div>
    );
  }

  const question = data.questions[current];
  const isLast = current === totalQuestions - 1;
  const isFirst = current === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="student-page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{data.quizTitle}</h1>
          <p className="text-sm text-slate-500">
            Attempt #{data.attemptNumber} · {data.courseTitle}
          </p>
        </div>
        {remainingMs !== null && (
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-lg font-semibold tabular-nums",
              remainingMs < 60_000
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-primary-200 bg-primary-50 text-primary-900"
            )}
            aria-live="polite"
          >
            <Clock className="h-5 w-5" aria-hidden="true" />
            {formatClock(remainingMs / 1000)}
          </div>
        )}
      </div>

      {/* Progress / answered */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-700">
          Question {current + 1} of {totalQuestions}
        </span>
        <span className="flex items-center gap-2 text-slate-600">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {answeredCount} answered
          </span>
          <span className="inline-flex items-center gap-1">
            <Circle className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {unansweredCount} unanswered
          </span>
        </span>
      </div>

      {/* Question card */}
      {question ? (
        <Card className="rounded-2xl border-primary-100">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-medium text-slate-900 sm:text-lg">
                {question.question}
              </h2>
              <Badge variant="neutral" className="shrink-0">
                {question.marks} {question.marks === 1 ? "mark" : "marks"}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectOption(question.id, option.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors sm:text-base",
                      "min-h-[52px]",
                      selected
                        ? "border-primary-600 bg-primary-50 text-primary-900 ring-1 ring-primary-600"
                        : "border-primary-100 bg-white text-slate-800 hover:border-primary-300 hover:bg-primary-50/60"
                    )}
                    aria-pressed={selected}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        selected
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-slate-300 text-slate-600"
                      )}
                      aria-hidden="true"
                    >
                      {option.id.toUpperCase()}
                    </span>
                    <span className="flex-1">{option.text}</span>
                    {selected && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-primary-100">
          <CardContent className="py-10 text-center text-sm text-slate-500">
            This test has no questions available.
          </CardContent>
        </Card>
      )}

      {/* Nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={isFirst}
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Previous
        </Button>
        {isLast ? (
          <Button onClick={() => setShowConfirm(true)} disabled={submitting} isLoading={submitting}>
            <Send className="h-4 w-4 mr-1" aria-hidden="true" />
            Submit Test
          </Button>
        ) : (
          <Button onClick={() => setCurrent((c) => Math.min(totalQuestions - 1, c + 1))}>
            Next <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Save indicator */}
      <div className="text-xs text-slate-500">
        {saveState === "saving" ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Saving…
          </span>
        ) : saveState === "saved" ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Saved
          </span>
        ) : saveState === "error" ? (
          <span className="inline-flex items-center gap-1 text-red-600">
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Save failed — will retry
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Circle className="h-3.5 w-3.5" aria-hidden="true" /> Changes saved automatically
          </span>
        )}
      </div>

      {/* Question navigator */}
      <Card className="rounded-2xl border-primary-100">
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-medium text-slate-700">Questions</p>
          <div className="flex flex-wrap gap-2">
            {data.questions.map((q, i) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = i === current;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium",
                    isCurrent
                      ? "border-primary-600 bg-primary-600 text-white"
                      : isAnswered
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={isCurrent ? "true" : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit confirmation */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Submit your test?"
        description={`Answered: ${answeredCount}/${totalQuestions} · Unanswered: ${unansweredCount}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={submitting}>
              Keep Working
            </Button>
            <Button onClick={() => submit("manual")} disabled={submitting} isLoading={submitting}>
              Submit Test
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to submit your test? You will not be able to change your
          answers after submission.
        </p>
      </Modal>
    </div>
  );
}
