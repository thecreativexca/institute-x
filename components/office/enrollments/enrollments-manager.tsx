"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, UserRoundCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  createManualEnrollmentAction,
  updateEnrollmentAction,
} from "@/lib/office/enrollments/actions";
import type {
  EnrollmentActionResult,
  EnrollmentCourseOption,
  EnrollmentListItem,
} from "@/lib/office/enrollments/dto";

export function EnrollmentsManager({
  enrollments,
  courses,
}: {
  enrollments: EnrollmentListItem[];
  courses: EnrollmentCourseOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<EnrollmentListItem | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function finish(result: EnrollmentActionResult, close: () => void) {
    if (result.ok) {
      setNotice({ ok: true, text: result.message ?? "Enrollment saved." });
      setFieldErrors({});
      close();
      router.refresh();
    } else {
      setNotice({ ok: false, text: result.error ?? "Review the highlighted fields." });
      setFieldErrors(result.fieldErrors ?? {});
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setNotice(null); setFieldErrors({}); setCreateOpen(true); }} className="rounded-xl">
          <Plus className="h-4 w-4" /> Manual enrollment
        </Button>
      </div>
      {notice ? (
        <div role={notice.ok ? "status" : "alert"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {notice.text}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead><tr className="text-xs uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Access</th><th className="px-4 py-3">Enrolled</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{item.studentName}</p><p className="text-xs text-slate-500">{item.studentEmail}</p></td>
                  <td className="px-4 py-3 font-medium text-slate-700">{item.courseName}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{sourceLabel(item.source)}</td>
                  <td className="px-4 py-3 text-slate-600">{item.expiresAt ? `Until ${formatDate(item.expiresAt)}` : "Lifetime"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(item.enrolledAt)}</td>
                  <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => { setNotice(null); setEditing(item); }}>Manage</Button></td>
                </tr>
              ))}
              {enrollments.length === 0 ? <tr><td colSpan={7} className="px-6 py-14 text-center text-slate-500">No enrollments match these filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen ? (
        <CreateEnrollmentModal
          courses={courses}
          pending={pending}
          fieldErrors={fieldErrors}
          onClose={() => !pending && setCreateOpen(false)}
          onSubmit={(input) => startTransition(async () => finish(await createManualEnrollmentAction(input), () => setCreateOpen(false)))}
        />
      ) : null}
      {editing ? (
        <ManageEnrollmentModal
          key={editing.id}
          enrollment={editing}
          pending={pending}
          onClose={() => !pending && setEditing(null)}
          onSubmit={(input) => startTransition(async () => finish(await updateEnrollmentAction(editing.id, input), () => setEditing(null)))}
        />
      ) : null}
    </div>
  );
}

function CreateEnrollmentModal({ courses, pending, fieldErrors, onClose, onSubmit }: {
  courses: EnrollmentCourseOption[];
  pending: boolean;
  fieldErrors: Record<string, string>;
  onClose: () => void;
  onSubmit: (input: { studentEmail: string; courseId: string; expiresAt?: string; notes?: string }) => void;
}) {
  const [studentEmail, setStudentEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Modal open onClose={onClose} title="Manual enrollment" description="Grant a student access without creating a Razorpay payment." footer={<><Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button isLoading={pending} onClick={() => onSubmit({ studentEmail, courseId, expiresAt, notes })}><UserRoundCheck className="h-4 w-4" /> Enroll student</Button></>}>
      <div className="space-y-4">
        <FieldShell id="student-email" label="Student email" required error={fieldErrors.studentEmail}><input id="student-email" type="email" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} className={controlClassName(Boolean(fieldErrors.studentEmail), "h-10")} placeholder="student@example.com" /></FieldShell>
        <FieldShell id="enrollment-course" label="Course" required error={fieldErrors.courseId}><select id="enrollment-course" value={courseId} onChange={(event) => setCourseId(event.target.value)} className={controlClassName(Boolean(fieldErrors.courseId), "h-10")}><option value="">Select a published course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></FieldShell>
        <FieldShell id="enrollment-expiry" label="Access expiry" optionalLabel="leave blank for lifetime" error={fieldErrors.expiresAt}><input id="enrollment-expiry" type="date" value={expiresAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setExpiresAt(event.target.value)} className={controlClassName(Boolean(fieldErrors.expiresAt), "h-10")} /></FieldShell>
        <FieldShell id="enrollment-notes" label="Internal note" optionalLabel="optional" error={fieldErrors.notes}><textarea id="enrollment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} className={controlClassName(Boolean(fieldErrors.notes), "min-h-20 py-2")} /></FieldShell>
      </div>
    </Modal>
  );
}

function ManageEnrollmentModal({ enrollment, pending, onClose, onSubmit }: {
  enrollment: EnrollmentListItem;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: { status: string; expiresAt?: string }) => void;
}) {
  const [status, setStatus] = useState(enrollment.status);
  const [expiresAt, setExpiresAt] = useState(enrollment.expiresAt?.slice(0, 10) ?? "");
  return (
    <Modal open onClose={onClose} title="Manage enrollment" description={`${enrollment.studentName} · ${enrollment.courseName}`} footer={<><Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button><Button isLoading={pending} onClick={() => onSubmit({ status, expiresAt })}>Save changes</Button></>}>
      <div className="space-y-4">
        <FieldShell id="enrollment-status" label="Status"><select id="enrollment-status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={controlClassName(false, "h-10")}><option value="active">Active</option><option value="completed">Completed</option><option value="expired">Expired</option><option value="cancelled">Cancelled / revoked</option></select></FieldShell>
        <FieldShell id="manage-expiry" label="Access expiry" optionalLabel="blank for lifetime"><div className="relative"><CalendarClock className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="manage-expiry" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className={controlClassName(false, "h-10 pl-9")} /></div></FieldShell>
      </div>
    </Modal>
  );
}

function StatusBadge({ status }: { status: EnrollmentListItem["status"] }) {
  const variant = status === "active" ? "success" : status === "completed" ? "primary" : status === "cancelled" ? "danger" : "warning";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

function sourceLabel(source: EnrollmentListItem["source"]) {
  return source === "razorpay" ? "Razorpay" : source === "free_course" ? "Free course" : "Admin manual";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}
