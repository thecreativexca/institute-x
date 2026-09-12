"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createSessionAction,
  updateSessionAction,
  deleteSessionAction,
  setSessionDisplayAction,
  type ActionState,
} from "@/lib/office/sessions/mutations";
import { SESSION_STATUSES } from "@/lib/constants";
import type {
  OfficeSessionRow,
  SessionCourseOption,
  SessionFormValues,
} from "@/lib/office/sessions/dto";
import { CalendarDays, Clock, MapPin, Plus, Pencil, Trash2, GraduationCap } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = {
  scheduled: { label: "Scheduled", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

function emptyForm(): SessionFormValues {
  return {
    courseId: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    address: "",
    instructorName: "",
    notes: "",
    status: SESSION_STATUSES.SCHEDULED,
    isDisplayed: true,
  };
}

interface SessionModalProps {
  open: boolean;
  onClose: () => void;
  courseOptions: SessionCourseOption[];
  editing?: OfficeSessionRow;
  onSubmitted: (result: ActionState) => void;
}

function SessionModal({ open, onClose, courseOptions, editing, onSubmitted }: SessionModalProps) {
  const [values, setValues] = useState<SessionFormValues>(
    editing
      ? {
          courseId: editing.courseId,
          title: editing.title,
          date: editing.date,
          startTime: editing.startTime,
          endTime: editing.endTime,
          venue: editing.venue,
          address: editing.address,
          instructorName: editing.instructorName,
          notes: editing.notes,
          status: editing.status,
          isDisplayed: editing.isDisplayed,
        }
      : emptyForm()
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof SessionFormValues>(key: K, value: SessionFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleSubmit() {
    setError("");
    setFieldErrors({});
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "isDisplayed") formData.append(key, value ? "on" : "");
      else formData.append(key, String(value ?? ""));
    });

    startTransition(async () => {
      const result = editing
        ? await updateSessionAction(editing.id, { ok: false }, formData)
        : await createSessionAction({ ok: false }, formData);
      if (!result.ok) {
        setError(result.error ?? "Could not save this class.");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }
      onSubmitted(result);
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isPending) onClose();
      }}
      title={editing ? "Edit class" : "Schedule a class"}
      description="Offline / venue classes scheduled against a course."
    >
      <div className="grid gap-4">
        <FieldShell label="Course" id="s-course" error={fieldErrors.courseId} required>
          <select
            id="s-course"
            value={values.courseId}
            onChange={(e) => set("courseId", e.target.value)}
            className={controlClassName(!!fieldErrors.courseId)}
          >
            <option value="">Select a course…</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Class title" id="s-title" error={fieldErrors.title} required>
          <input
            id="s-title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            className={controlClassName(!!fieldErrors.title)}
            placeholder="e.g. Week 4 — Live doubt-solving session"
            maxLength={200}
          />
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldShell label="Date" id="s-date" error={fieldErrors.date} required>
            <input
              id="s-date"
              type="date"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
              className={controlClassName(!!fieldErrors.date)}
            />
          </FieldShell>
          <FieldShell label="Start time" id="s-start" error={fieldErrors.startTime}>
            <input
              id="s-start"
              type="time"
              value={values.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              className={controlClassName(!!fieldErrors.startTime)}
            />
          </FieldShell>
          <FieldShell label="End time" id="s-end" error={fieldErrors.endTime}>
            <input
              id="s-end"
              type="time"
              value={values.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              className={controlClassName(!!fieldErrors.endTime)}
            />
          </FieldShell>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Venue / room / hall" id="s-venue" error={fieldErrors.venue} required>
            <input
              id="s-venue"
              value={values.venue}
              onChange={(e) => set("venue", e.target.value)}
              className={controlClassName(!!fieldErrors.venue)}
              placeholder="e.g. Classroom 2, Main Building"
              maxLength={200}
            />
          </FieldShell>
          <FieldShell label="Address" id="s-address" error={fieldErrors.address} optionalLabel="optional">
            <input
              id="s-address"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              className={controlClassName(!!fieldErrors.address)}
              maxLength={300}
            />
          </FieldShell>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Instructor name" id="s-instructor" optionalLabel="optional">
            <input
              id="s-instructor"
              value={values.instructorName}
              onChange={(e) => set("instructorName", e.target.value)}
              className={controlClassName(false)}
              maxLength={120}
            />
          </FieldShell>
          <FieldShell label="Status" id="s-status">
            <select
              id="s-status"
              value={values.status}
              onChange={(e) => set("status", e.target.value as SessionFormValues["status"])}
              className={controlClassName(false)}
            >
              <option value={SESSION_STATUSES.SCHEDULED}>Scheduled</option>
              <option value={SESSION_STATUSES.COMPLETED}>Completed</option>
              <option value={SESSION_STATUSES.CANCELLED}>Cancelled</option>
            </select>
          </FieldShell>
        </div>

        <FieldShell label="Notes for students" id="s-notes" optionalLabel="optional">
          <textarea
            id="s-notes"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={controlClassName(false, "min-h-24")}
            maxLength={1000}
          />
        </FieldShell>

        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={values.isDisplayed}
            onChange={(e) => set("isDisplayed", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600/40"
          />
          Visible to enrolled students
        </label>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}

        <div className="mt-2 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            {editing ? "Save changes" : "Schedule class"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface SessionsManagerProps {
  sessions: OfficeSessionRow[];
  courseOptions: SessionCourseOption[];
  canManage: boolean;
}

export function SessionsManager({ sessions, courseOptions, canManage }: SessionsManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; session: OfficeSessionRow } | null>(null);

  const { upcomingCount, completedCount, totalCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      totalCount: sessions.length,
      upcomingCount: sessions.filter((s) => s.status === "scheduled" && new Date(`${s.date}T00:00:00`) >= today).length,
      completedCount: sessions.filter((s) => s.status === "completed").length,
    };
  }, [sessions]);

  function runMutation(action: () => Promise<ActionState>, successMessage?: string) {
    setError("");
    setStatus("");
    // actions resolve in a transition so the button can disable.
    const run = async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Action failed.");
        return;
      }
      if (successMessage) setStatus(successMessage);
      router.refresh();
    };
    void run();
  }

  function handleDelete(session: OfficeSessionRow) {
    if (!window.confirm(`Delete "${session.title}" on ${session.date}?`)) return;
    setStatus("");
    runMutation(() => deleteSessionAction(session.id));
  }

  function handleToggleDisplay(session: OfficeSessionRow) {
    runMutation(() => setSessionDisplayAction(session.id, !session.isDisplayed));
  }

  function handleSubmitted(result: ActionState) {
    if (result.message) setStatus(result.message);
    setModal(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {status ? (
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{status}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {totalCount} class{totalCount !== 1 ? "es" : ""} · {upcomingCount} upcoming · {completedCount} completed
        </p>
        {canManage ? (
          <Button onClick={() => setModal({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Schedule class
          </Button>
        ) : null}
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<CalendarDays className="h-12 w-12" />}
              title="No classes found"
              description="Schedule an offline / venue class against one of your courses."
              action={
                canManage ? (
                  <Button onClick={() => setModal({ mode: "create" })}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Schedule a class
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              canManage={canManage}
              onEdit={() => setModal({ mode: "edit", session })}
              onDelete={() => handleDelete(session)}
              onToggleDisplay={() => handleToggleDisplay(session)}
            />
          ))}
        </div>
      )}

      {modal ? (
        <SessionModal
          open
          onClose={() => setModal(null)}
          courseOptions={courseOptions}
          editing={modal.mode === "edit" ? modal.session : undefined}
          onSubmitted={handleSubmitted}
        />
      ) : null}
    </div>
  );
}

function SessionCard({
  session,
  canManage,
  onEdit,
  onDelete,
  onToggleDisplay,
}: {
  session: OfficeSessionRow;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDisplay: () => void;
}) {
  const statusMeta = STATUS_LABELS[session.status] ?? { label: session.status, variant: "secondary" as const };
  const timeRange = session.startTime
    ? session.endTime
      ? `${session.startTime} – ${session.endTime}`
      : session.startTime
    : "Time to be announced";

  return (
    <Card className="border-slate-200/80 transition-shadow hover:shadow-card-hover">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              {!session.isDisplayed ? <Badge variant="neutral">Hidden</Badge> : null}
            </div>
            <p className="mt-1.5 font-semibold text-slate-900">{session.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                {session.courseName}
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDate(session.date)} · {timeRange}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {session.venue}
              </span>
            </p>
            {session.instructorName || session.address ? (
              <p className="mt-1 text-xs text-slate-400">
                {[session.instructorName && `Instructor: ${session.instructorName}`, session.address]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        {canManage ? (
          <div className="flex shrink-0 items-center gap-2 lg:pl-4">
            <Button variant="outline" size="sm" onClick={onToggleDisplay}>
              {session.isDisplayed ? "Hide" : "Show"}
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(y, m - 1, d, 12)
  );
}
