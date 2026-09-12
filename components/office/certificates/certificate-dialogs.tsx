"use client";

import { useCallback, useState, type ChangeEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ALLOWED_CERTIFICATE_EXTENSIONS,
  DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB,
} from "@/lib/constants";
import type { OfficeCertificateRow } from "@/lib/office/certificates/dto";
import { CertificateStatusBadge } from "./certificate-status-badge";
import { ArrowLeft, Download, Upload, RefreshCw } from "lucide-react";

export type CertificateDialogMode =
  | "view"
  | "edit"
  | "replace"
  | "revoke"
  | "reactivate"
  | "delete";

interface CertificateDialogsProps {
  mode: CertificateDialogMode;
  certificate: OfficeCertificateRow;
  courses: Array<{ id: string; label: string }>;
  onClose: () => void;
  /** Called after a successful mutation so the list can refresh + toast. */
  onSuccess: (message: string) => void;
}

const ACCEPT_ATTRIBUTE = ALLOWED_CERTIFICATE_EXTENSIONS.map((e) => `.${e}`).join(",");

/**
 * All admin certificate dialogs in one place: view, edit details, replace file,
 * revoke, reactivate and delete.
 *
 * Every mutation posts to an ADMIN-guarded API route; nothing here decides
 * authorisation for itself. Errors are surfaced verbatim from the server so a
 * duplicate certificate number or a rejected file type reads clearly.
 */
export function CertificateDialogs({
  mode,
  certificate,
  courses,
  onClose,
  onSuccess,
}: CertificateDialogsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (
      url: string,
      init: RequestInit,
      successMessage: string,
      fallbackError: string
    ) => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch(url, init);
        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; error?: string; message?: string }
          | null;

        if (!response.ok || !payload?.success) {
          setError(payload?.error ?? fallbackError);
          return;
        }
        onSuccess(payload.message ?? successMessage);
      } catch {
        setError("Something went wrong. Please check your connection and try again.");
      } finally {
        setBusy(false);
      }
    },
    [onSuccess]
  );

  if (mode === "view") {
    return <ViewDialog certificate={certificate} onClose={onClose} />;
  }

  if (mode === "revoke") {
    return (
      <RevokeDialog
        certificate={certificate}
        busy={busy}
        error={error}
        onClose={onClose}
        onSubmit={(reason) =>
          request(
            `/api/office/certificates/${certificate.id}/revoke`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            },
            "Certificate revoked successfully.",
            "Unable to revoke the certificate."
          )
        }
      />
    );
  }

  if (mode === "reactivate") {
    return (
      <ConfirmDialog
        title="Reactivate certificate"
        description="The certificate will become valid again and the student will be able to download it."
        confirmLabel="Reactivate certificate"
        confirmVariant="primary"
        busy={busy}
        error={error}
        onClose={onClose}
        onConfirm={() =>
          request(
            `/api/office/certificates/${certificate.id}/reactivate`,
            { method: "PATCH" },
            "Certificate reactivated successfully.",
            "Unable to reactivate the certificate."
          )
        }
      >
        <dl className="grid gap-2 text-sm">
          <Row label="Student" value={certificate.studentName} />
          <Row label="Certificate no." value={certificate.certificateNumber} mono />
          {certificate.revocationReason ? (
            <Row label="Original reason" value={certificate.revocationReason} />
          ) : null}
        </dl>
      </ConfirmDialog>
    );
  }

  if (mode === "delete") {
    return (
      <ConfirmDialog
        title="Delete certificate"
        description="This permanently removes the certificate record and its stored file. This cannot be undone."
        confirmLabel="Delete permanently"
        confirmVariant="danger"
        busy={busy}
        error={error}
        onClose={onClose}
        onConfirm={() =>
          request(
            `/api/office/certificates/${certificate.id}`,
            { method: "DELETE" },
            "Certificate deleted successfully.",
            "Unable to delete the certificate."
          )
        }
      >
        <Alert variant="destructive">
          Deleting <strong>{certificate.certificateNumber}</strong> for{" "}
          <strong>{certificate.studentName}</strong> also deletes the uploaded
          file. The public verification link for this certificate will stop
          working. If you only need to invalidate it, use{" "}
          <strong>Revoke</strong> instead.
        </Alert>
      </ConfirmDialog>
    );
  }

  if (mode === "replace") {
    return (
      <ReplaceDialog
        certificate={certificate}
        busy={busy}
        error={error}
        onClose={onClose}
        onSubmit={(file) => {
          const formData = new FormData();
          formData.append("file", file);
          return request(
            `/api/office/certificates/${certificate.id}/replace`,
            { method: "PATCH", body: formData },
            "Certificate replaced successfully.",
            "Unable to replace the certificate file."
          );
        }}
      />
    );
  }

  return (
    <EditDialog
      certificate={certificate}
      courses={courses}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={(body) =>
        request(
          `/api/office/certificates/${certificate.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
          "Certificate updated successfully.",
          "Unable to update the certificate."
        )
      }
    />
  );
}

/* ------------------------------- View ---------------------------------- */

function ViewDialog({
  certificate,
  onClose,
}: {
  certificate: OfficeCertificateRow;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const isImage = certificate.fileType?.startsWith("image/") ?? false;
  const fileUrl = `/api/office/certificates/${certificate.id}/file`;

  return (
    <Modal
      open
      onClose={onClose}
      title={certificate.certificateTitle ?? certificate.courseName}
      description={`${certificate.certificateNumber} · ${certificate.studentName}`}
      className="max-w-4xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={`/api/office/certificates/${certificate.id}/download`}>
              <Download className="h-4 w-4" aria-hidden="true" /> Download
            </a>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <CertificateStatusBadge
            status={certificate.status}
            restoredAt={certificate.restoredAt}
          />
          {certificate.replacedAt ? (
            <Badge variant="neutral">File replaced</Badge>
          ) : null}
        </div>

        {certificate.status === "revoked" ? (
          <Alert variant="destructive">
            This certificate is revoked
            {certificate.revocationReason
              ? `: ${certificate.revocationReason}`
              : "."}
          </Alert>
        ) : null}

        {loading ? <Skeleton className="aspect-[297/210] w-full" /> : null}
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- streamed from an authenticated API route
          <img
            src={fileUrl}
            alt={`Certificate ${certificate.certificateNumber}`}
            className="mx-auto max-h-[60vh] w-auto rounded-lg border border-slate-200"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        ) : (
          <iframe
            title={`Certificate ${certificate.certificateNumber}`}
            src={fileUrl}
            className="h-[60vh] w-full rounded-lg border border-slate-200"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------- Edit ---------------------------------- */

interface EditBody {
  certificateTitle?: string;
  certificateNumber?: string;
  courseId?: string;
  issueDate?: string;
  completionDate?: string;
  grade?: string;
  notes?: string;
}

function EditDialog({
  certificate,
  courses,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  certificate: OfficeCertificateRow;
  courses: Array<{ id: string; label: string }>;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (body: EditBody) => void;
}) {
  const [title, setTitle] = useState(certificate.certificateTitle ?? "");
  const [number, setNumber] = useState(certificate.certificateNumber);
  const [courseId, setCourseId] = useState(certificate.courseId ?? "");
  const [issueDate, setIssueDate] = useState(toDateInput(certificate.issueDate));
  const [completionDate, setCompletionDate] = useState(
    toDateInput(certificate.completionDate)
  );
  const [grade, setGrade] = useState(certificate.grade ?? "");
  const [notes, setNotes] = useState(certificate.notes ?? "");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      certificateTitle: title,
      certificateNumber: number,
      // "" detaches the course; the server treats an empty string as null.
      courseId: courseId || "",
      issueDate,
      completionDate,
      grade,
      notes,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit certificate details"
      description="Metadata only — the uploaded file is unchanged. Use Replace to swap the file."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="certificate-edit-form" isLoading={busy} disabled={busy}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="certificate-edit-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        <FieldShell id="edit-title" label="Certificate title" required>
          <input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className={controlClassName(false, "h-10")}
          />
        </FieldShell>

        <FieldShell
          id="edit-number"
          label="Certificate number"
          required
          hint="Must stay unique across all certificates."
        >
          <input
            id="edit-number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            className={controlClassName(false, "h-10 font-mono")}
          />
        </FieldShell>

        <FieldShell id="edit-course" label="Course" optionalLabel="optional">
          <select
            id="edit-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={controlClassName(false, "h-10")}
          >
            <option value="">No course (general certificate)</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell id="edit-issue-date" label="Issue date" required>
            <input
              id="edit-issue-date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className={controlClassName(false, "h-10")}
            />
          </FieldShell>

          <FieldShell id="edit-completion-date" label="Completion date" optionalLabel="optional">
            <input
              id="edit-completion-date"
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className={controlClassName(false, "h-10")}
            />
          </FieldShell>
        </div>

        <FieldShell
          id="edit-grade"
          label="Grade / Score"
          optionalLabel="optional"
          hint="Free text, e.g. A+, 92%, Excellent."
        >
          <input
            id="edit-grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            maxLength={60}
            className={controlClassName(false, "h-10")}
          />
        </FieldShell>

        <FieldShell
          id="edit-notes"
          label="Internal notes"
          optionalLabel="optional"
          hint="Admin-only. Never shown to students or on the public verification page."
        >
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={3}
            className={controlClassName(false, "py-2")}
          />
        </FieldShell>
      </form>
    </Modal>
  );
}

/* ------------------------------ Replace -------------------------------- */

function ReplaceDialog({
  certificate,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  certificate: OfficeCertificateRow;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Replace certificate file"
      description="The certificate record, number and status history are preserved. The previous file is deleted after the new one is stored."
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            isLoading={busy}
            disabled={busy || !file}
            onClick={() => file && onSubmit(file)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Replace file
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        <dl className="grid gap-2 text-sm">
          <Row label="Student" value={certificate.studentName} />
          <Row label="Certificate no." value={certificate.certificateNumber} mono />
          <Row
            label="Current file"
            value={
              certificate.originalFileName ??
              `${certificate.fileType ?? "application/pdf"}`
            }
          />
        </dl>

        <FieldShell
          id="replace-file"
          label="New certificate file"
          required
          hint={`PDF, JPG, JPEG or PNG · up to ${DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB} MB`}
        >
          <input
            id="replace-file"
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            onChange={onPick}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800"
          />
        </FieldShell>

        {file ? (
          <p className="text-xs text-slate-500">
            Selected <span className="font-medium text-slate-700">{file.name}</span> (
            {formatBytes(file.size)})
          </p>
        ) : (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Choose the corrected certificate file.
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------- Revoke -------------------------------- */

function RevokeDialog({
  certificate,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  certificate: OfficeCertificateRow;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(reason.trim());
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Revoke certificate"
      description="The certificate stays on record but is marked invalid everywhere, and the student can no longer download it."
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="certificate-revoke-form"
            variant="danger"
            isLoading={busy}
            disabled={busy || reason.trim().length < 5}
          >
            Revoke certificate
          </Button>
        </>
      }
    >
      <form id="certificate-revoke-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        <dl className="grid gap-2 text-sm">
          <Row label="Student" value={certificate.studentName} />
          <Row label="Course" value={certificate.courseName} />
          <Row label="Certificate no." value={certificate.certificateNumber} mono />
        </dl>

        <FieldShell
          id="revoke-reason"
          label="Reason for revocation"
          required
          hint="Stored with the certificate and shown to the student and on public verification."
        >
          <textarea
            id="revoke-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            minLength={5}
            maxLength={500}
            required
            placeholder="e.g. Issued in error — duplicate of SDI-2026-000118"
            className={controlClassName(false, "py-2")}
          />
        </FieldShell>

        <Alert variant="warning">
          Revoking does not delete anything. You can reactivate the certificate
          later from the Revoked Certificates view.
        </Alert>
      </form>
    </Modal>
  );
}

/* ------------------------------ Confirm -------------------------------- */

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant,
  busy,
  error,
  onClose,
  onConfirm,
  children,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "primary" | "danger";
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            isLoading={busy}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        {children}
      </div>
    </Modal>
  );
}

/* ------------------------------- Bits ---------------------------------- */

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

/** ISO string → `YYYY-MM-DD` for <input type="date">. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
