"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, FileCheck2, FileText, Upload } from "lucide-react";

import { StudentPageHeader } from "@/components/student/student-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { StudentAssignmentItem } from "@/lib/student/assignments";
import { refreshNotifications } from "@/lib/notifications/client";

export function StudentAssignmentsClient({ assignments }: { assignments: StudentAssignmentItem[] }) {
  const [selected, setSelected] = useState<StudentAssignmentItem | null>(null);
  const pending = assignments.filter((item) => !item.submission || item.submission.status === "submitted");
  const graded = assignments.filter((item) => item.submission?.status === "graded");
  return (
    <div className="space-y-8">
      <StudentPageHeader title="Assignments" description="Submit coursework and review marks and feedback." icon={<FileText className="h-6 w-6" />} eyebrow="Coursework" />
      <AssignmentSection title="Pending and submitted" description="Open assignments and work awaiting review." items={pending} emptyTitle="Nothing pending" emptyDescription="You are up to date with published assignments." onOpen={setSelected} />
      <AssignmentSection title="Reviewed" description="Marks and feedback from completed reviews." items={graded} emptyTitle="No reviewed work yet" emptyDescription="Reviewed submissions will appear here." onOpen={setSelected} reviewed />
      {selected ? <SubmissionModal key={selected.id} assignment={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function AssignmentSection({ title, description, items, emptyTitle, emptyDescription, onOpen, reviewed = false }: { title: string; description: string; items: StudentAssignmentItem[]; emptyTitle: string; emptyDescription: string; onOpen: (item: StudentAssignmentItem) => void; reviewed?: boolean }) {
  return <section className="space-y-3"><div><h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="text-sm text-slate-500">{description}</p></div>{items.length ? items.map((item) => <AssignmentCard key={item.id} item={item} onOpen={() => onOpen(item)} />) : <EmptyState icon={reviewed ? <FileCheck2 className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />} title={emptyTitle} description={emptyDescription} />}</section>;
}

function AssignmentCard({ item, onOpen }: { item: StudentAssignmentItem; onOpen: () => void }) {
  const overdue = Boolean(item.dueAt && new Date(item.dueAt) < new Date() && !item.submission);
  return (
    <Card className="rounded-2xl border-primary-100">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={item.submission?.status === "graded" ? "success" : item.submission ? "primary" : overdue ? "danger" : "warning"}>{item.submission?.status === "graded" ? "Reviewed" : item.submission ? "Submitted" : overdue ? "Overdue" : "Pending"}</Badge><span className="text-xs text-slate-500">{item.courseName}</span></div>
          <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.instructions}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{item.dueAt ? `Due ${formatDate(item.dueAt)}` : "No due date"}</span><span>{item.maxScore} marks</span>{item.submission?.score !== null && item.submission?.score !== undefined ? <span className="font-semibold text-primary-700">Score {item.submission.score}/{item.submission.totalMarks ?? item.maxScore}</span> : null}</div>
          {item.submission?.feedback ? <p className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-900"><strong>Feedback:</strong> {item.submission.feedback}</p> : null}
        </div>
        <Button variant={item.submission?.status === "graded" ? "outline" : "primary"} onClick={onOpen}>{item.submission?.status === "graded" ? "View submission" : item.submission ? "Update submission" : "Submit work"}</Button>
      </CardContent>
    </Card>
  );
}

function SubmissionModal({ assignment, onClose }: { assignment: StudentAssignmentItem; onClose: () => void }) {
  const router = useRouter();
  const [content, setContent] = useState(assignment.submission?.content ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const graded = assignment.submission?.status === "graded";
  async function submit() {
    setError(""); setSubmitting(true);
    try {
      const data = new FormData(); data.set("content", content); if (file) data.set("file", file);
      const response = await fetch(`/api/student/assignments/${assignment.id}/submit`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit assignment.");
      refreshNotifications();
      onClose(); router.refresh();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to submit assignment."); }
    finally { setSubmitting(false); }
  }
  return (
    <Modal open onClose={onClose} title={assignment.title} description={`${assignment.courseName} · ${assignment.maxScore} marks`} className="max-h-[90vh] max-w-2xl overflow-y-auto" footer={<><Button variant="outline" onClick={onClose} disabled={submitting}>Close</Button>{!graded ? <Button isLoading={submitting} onClick={submit}><Upload className="h-4 w-4" /> Submit assignment</Button> : null}</>}>
      <div className="space-y-4"><div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">{assignment.instructions}</div><FieldShell id="assignment-answer" label="Written answer" optionalLabel="optional"><textarea id="assignment-answer" value={content} disabled={graded} onChange={(event) => setContent(event.target.value)} maxLength={20000} className={controlClassName(false, "min-h-40 py-2")} /></FieldShell>{!graded ? <FieldShell id="assignment-file" label="Attachment" optionalLabel="PDF, DOC, DOCX or TXT"><input id="assignment-file" type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" /></FieldShell> : null}{assignment.submission?.fileUrl ? <a href={assignment.submission.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"><FileText className="h-4 w-4" />{assignment.submission.originalFileName ?? "Open attachment"}</a> : null}{error ? <p className="text-sm font-medium text-red-700" role="alert">{error}</p> : null}</div>
    </Modal>
  );
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)); }
