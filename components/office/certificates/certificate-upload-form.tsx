"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  ALLOWED_CERTIFICATE_EXTENSIONS,
  DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB,
} from "@/lib/constants";
import type {
  CertificateEligibleEnrollmentOption,
  CertificateOption,
} from "@/lib/office/certificates/dto";
import { StudentCombobox } from "./student-combobox";
import {
  Sparkles,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

const ACCEPT_ATTRIBUTE = ALLOWED_CERTIFICATE_EXTENSIONS.map((e) => `.${e}`).join(",");
const MAX_BYTES = DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB * 1024 * 1024;

interface UploadState {
  progress: number;
  uploading: boolean;
}

/**
 * Admin certificate upload form (spec §2).
 *
 * Everything the browser can legitimately check is checked here for fast
 * feedback (file type + size), and everything it cannot is checked again on the
 * server (magic bytes, student existence, duplicate number, admin role).
 *
 * The upload uses XMLHttpRequest rather than fetch purely for `upload.onprogress`
 * — fetch cannot report upload progress, and a 10 MB PDF with no feedback feels
 * broken. The browser never sees a Cloudinary credential: the bytes go to our
 * own route handler, which streams them to storage server-side.
 */
export function CertificateUploadForm() {
  const router = useRouter();

  const [student, setStudent] = useState<CertificateOption | null>(null);
  const [courses, setCourses] = useState<CertificateOption[]>([]);
  const [issuable, setIssuable] = useState<CertificateEligibleEnrollmentOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseId, setCourseId] = useState("");

  const [certificateTitle, setCertificateTitle] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [issueDate, setIssueDate] = useState(today());
  const [completionDate, setCompletionDate] = useState("");
  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadState>({ progress: 0, uploading: false });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onStudentChange = useCallback(async (next: CertificateOption | null) => {
    setStudent(next);
    setCourseId("");
    setCourses([]);
    setIssuable([]);
    if (!next) return;

    setLoadingCourses(true);
    try {
      const response = await fetch(
        `/api/office/certificates/students/${next.id}/courses`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as {
        success: boolean;
        courses?: CertificateOption[];
        issuableEnrollments?: CertificateEligibleEnrollmentOption[];
      };
      if (payload.success) {
        setCourses(payload.courses ?? []);
        setIssuable(payload.issuableEnrollments ?? []);
      }
    } catch {
      // Non-fatal: the course field stays optional and the admin can retry by
      // re-selecting the student.
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const generateNumber = useCallback(async () => {
    setGeneratingNumber(true);
    setError(null);
    try {
      const response = await fetch("/api/office/certificates/generate-number", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        success: boolean;
        certificateNumber?: string;
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.certificateNumber) {
        setError(payload.error ?? "Could not generate a certificate number.");
        return;
      }
      setCertificateNumber(payload.certificateNumber);
    } catch {
      setError("Could not generate a certificate number. Please try again.");
    } finally {
      setGeneratingNumber(false);
    }
  }, []);

  const onPickFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    setFileError(null);

    if (!picked) {
      setFile(null);
      return;
    }

    const extension = picked.name.split(".").pop()?.toLowerCase() ?? "";
    if (!(ALLOWED_CERTIFICATE_EXTENSIONS as readonly string[]).includes(extension)) {
      setFileError("Only PDF, JPG, JPEG and PNG files are allowed.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (picked.size > MAX_BYTES) {
      setFileError(
        `That file is ${formatBytes(picked.size)}. The maximum size is ${DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB} MB.`
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(picked);
  }, []);

  const resetForm = useCallback(() => {
    setStudent(null);
    setCourses([]);
    setIssuable([]);
    setCourseId("");
    setCertificateTitle("");
    setCertificateNumber("");
    setIssueDate(today());
    setCompletionDate("");
    setGrade("");
    setNotes("");
    setFile(null);
    setFileError(null);
    setUpload({ progress: 0, uploading: false });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      if (!student) {
        setError("Please select the student this certificate belongs to.");
        return;
      }
      if (!file) {
        setFileError("Please choose the certificate file to upload.");
        return;
      }
      if (completionDate && completionDate > today()) {
        setError("The completion date cannot be in the future.");
        return;
      }

      const formData = new FormData();
      formData.append("studentId", student.id);
      if (courseId) formData.append("courseId", courseId);
      formData.append("certificateTitle", certificateTitle.trim());
      formData.append("certificateNumber", certificateNumber.trim());
      formData.append("issueDate", issueDate);
      if (completionDate) formData.append("completionDate", completionDate);
      if (grade.trim()) formData.append("grade", grade.trim());
      if (notes.trim()) formData.append("notes", notes.trim());
      formData.append("file", file);

      setUpload({ progress: 0, uploading: true });

      const request = new XMLHttpRequest();
      request.open("POST", "/api/office/certificates");

      request.upload.onprogress = (progressEvent) => {
        if (!progressEvent.lengthComputable) return;
        setUpload({
          uploading: true,
          progress: Math.round((progressEvent.loaded / progressEvent.total) * 100),
        });
      };

      request.onload = () => {
        setUpload({ progress: 0, uploading: false });

        let payload: { success?: boolean; error?: string; message?: string } | null = null;
        try {
          payload = JSON.parse(request.responseText);
        } catch {
          payload = null;
        }

        if (request.status < 200 || request.status >= 300 || !payload?.success) {
          setError(
            payload?.error ??
              "The certificate could not be uploaded. Please try again."
          );
          return;
        }

        setSuccess(payload.message ?? "Certificate uploaded successfully.");
        resetForm();
        router.refresh();
      };

      request.onerror = () => {
        setUpload({ progress: 0, uploading: false });
        setError("The upload failed. Please check your connection and try again.");
      };

      request.send(formData);
    },
    [
      student,
      courseId,
      certificateTitle,
      certificateNumber,
      issueDate,
      completionDate,
      grade,
      notes,
      file,
      resetForm,
      router,
    ]
  );

  const isImage = useMemo(
    () => (file ? file.type.startsWith("image/") : false),
    [file]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {success ? (
        <Alert variant="success" role="status" onClose={() => setSuccess(null)}>
          <p className="font-medium">{success}</p>
          <p className="mt-1 text-sm">
            The student can now see and download it under My Certificates.{" "}
            <Link href="/office/certificates" className="font-medium underline">
              Back to certificates
            </Link>
          </p>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {/* Student + course */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Student &amp; Course</CardTitle>
          <CardDescription>
            Choose who this certificate is issued to, then optionally link the
            course it belongs to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldShell
            id="upload-student"
            label="Student"
            required
            hint="Search by name, email or phone. The certificate is saved against this student's account."
          >
            <StudentCombobox value={student} onChange={onStudentChange} />
          </FieldShell>

          <FieldShell
            id="upload-course"
            label="Course"
            optionalLabel="optional"
            hint={
              student
                ? loadingCourses
                  ? "Loading this student's courses…"
                  : courses.length === 0
                    ? "This student has no enrollments — you can still issue a general certificate."
                    : "Defaults to the student's enrolled courses. You may pick any course."
                : "Select a student first to see their enrolled courses."
            }
          >
            <select
              id="upload-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              disabled={!student || loadingCourses}
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

          {issuable.length > 0 ? (
            <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-3">
              <p className="text-sm font-medium text-slate-800">
                Completed course{issuable.length > 1 ? "s" : ""} awaiting a certificate
              </p>
              <ul className="mt-2 space-y-1.5">
                {issuable.map((item) => (
                  <li
                    key={item.enrollmentId}
                    className="flex flex-wrap items-center gap-2 text-sm text-slate-600"
                  >
                    <span>{item.courseName}</span>
                    {item.alreadyIssued ? (
                      <Badge variant="neutral">Certificate already issued</Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCourseId(item.courseId);
                          if (!certificateTitle) {
                            setCertificateTitle(`${item.courseName} Certificate`);
                          }
                          if (!completionDate) {
                            setCompletionDate(item.completionDate.slice(0, 10));
                          }
                        }}
                      >
                        Use this course
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Certificate details */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Certificate Details</CardTitle>
          <CardDescription>
            The number is unique across all certificates and is what students and
            employers use to verify it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldShell id="upload-title" label="Certificate title" required>
            <input
              id="upload-title"
              value={certificateTitle}
              onChange={(event) => setCertificateTitle(event.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Full Stack Web Development Certificate"
              className={controlClassName(false, "h-10")}
            />
          </FieldShell>

          <FieldShell
            id="upload-number"
            label="Certificate number"
            required
            hint="Letters, numbers and hyphens only — e.g. SDI-2026-000123."
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="upload-number"
                value={certificateNumber}
                onChange={(event) => setCertificateNumber(event.target.value)}
                required
                maxLength={64}
                placeholder="SDI-2026-000123"
                className={controlClassName(false, "h-10 font-mono")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateNumber}
                isLoading={generatingNumber}
                disabled={generatingNumber}
                className="shrink-0"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Generate Certificate Number
              </Button>
            </div>
          </FieldShell>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell id="upload-issue-date" label="Issue date" required>
              <input
                id="upload-issue-date"
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
                required
                max={today()}
                className={controlClassName(false, "h-10")}
              />
            </FieldShell>

            <FieldShell
              id="upload-completion-date"
              label="Completion date"
              optionalLabel="optional"
              hint="Defaults to the issue date when left blank."
            >
              <input
                id="upload-completion-date"
                type="date"
                value={completionDate}
                onChange={(event) => setCompletionDate(event.target.value)}
                max={today()}
                className={controlClassName(false, "h-10")}
              />
            </FieldShell>
          </div>

          <FieldShell
            id="upload-grade"
            label="Grade / Score"
            optionalLabel="optional"
            hint="Free text — e.g. A+, 92%, Excellent."
          >
            <input
              id="upload-grade"
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              maxLength={60}
              className={controlClassName(false, "h-10")}
            />
          </FieldShell>

          <FieldShell
            id="upload-notes"
            label="Notes"
            optionalLabel="optional"
            hint="Internal only — never shown to students or on the public verification page."
          >
            <textarea
              id="upload-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={1000}
              className={controlClassName(false, "py-2")}
            />
          </FieldShell>
        </CardContent>
      </Card>

      {/* File */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Certificate File</CardTitle>
          <CardDescription>
            PDF, JPG, JPEG or PNG · up to {DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB} MB.
            Stored securely and delivered only to the student it belongs to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldShell id="upload-file" label="Certificate file" required error={fileError ?? undefined}>
            <input
              id="upload-file"
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              onChange={onPickFile}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800"
            />
          </FieldShell>

          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {isImage ? (
                <ImageIcon className="h-8 w-8 text-amber-800" aria-hidden="true" />
              ) : (
                <FileText className="h-8 w-8 text-amber-800" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {file.type || "unknown type"} · {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Remove selected file"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {upload.uploading ? (
            <div className="space-y-2" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Uploading certificate…</span>
                <span className="font-medium">{upload.progress}%</span>
              </div>
              <Progress value={upload.progress} aria-label="Upload progress" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="outline" type="button">
          <Link href="/office/certificates">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Cancel
          </Link>
        </Button>
        <Button
          type="submit"
          isLoading={upload.uploading}
          disabled={upload.uploading || !student || !file}
        >
          {upload.uploading ? (
            "Uploading…"
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" /> Upload Certificate
            </>
          )}
        </Button>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Students cannot upload, edit or delete certificates — they can only view,
        download and verify what you issue here.
      </p>
    </form>
  );
}

/** Today as `YYYY-MM-DD` in the browser's local timezone. */
function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
