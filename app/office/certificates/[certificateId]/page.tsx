import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { ArrowLeft } from "lucide-react";

import { OfficeShell } from "@/components/office/OfficeShell";
import { CertificateDetailActions } from "@/components/office/certificates/certificate-detail-actions";
import { CertificateStatusBadge } from "@/components/office/certificates/certificate-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/helpers";
import {
  getOfficeCertificate,
  listCourseOptions,
} from "@/lib/office/certificates/queries";

export const metadata: Metadata = {
  title: "Certificate — Office Portal",
  description: "Review and manage a certificate.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ certificateId: string }> };

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "d MMMM yyyy, HH:mm");
}

/**
 * Admin certificate detail (spec §1 "View" action).
 *
 * Shows the full record including the admin-only `notes` field, plus the
 * management actions. The file preview is streamed from an admin-guarded API
 * route, so no storage URL appears in the markup.
 */
export default async function OfficeCertificateDetailPage({ params }: PageProps) {
  const { user } = await requireAdmin();
  if (!user) return null;

  const { certificateId } = await params;
  const [certificate, courses] = await Promise.all([
    getOfficeCertificate(certificateId),
    listCourseOptions(),
  ]);

  if (!certificate) notFound();

  const isImage = certificate.fileType?.startsWith("image/") ?? false;

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/office/certificates">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Certificates
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {certificate.certificateTitle ?? certificate.courseName}
            </h1>
            <CertificateStatusBadge
              status={certificate.status}
              restoredAt={certificate.restoredAt}
            />
          </div>
          <p className="mt-1 font-mono text-sm text-slate-500">
            {certificate.certificateNumber}
          </p>
        </header>

        {certificate.status === "revoked" ? (
          <Alert variant="destructive">
            <p className="font-semibold">Certificate Revoked</p>
            <p className="mt-1 text-sm">
              {certificate.revocationReason ?? "No reason recorded."}
            </p>
            <p className="mt-1 text-xs">
              Revoked on {formatDate(certificate.revokedAt)}. The student cannot
              download it, and public verification reports it as revoked.
            </p>
          </Alert>
        ) : null}

        <CertificateDetailActions
          certificate={certificate}
          courses={courses.map((course) => ({ id: course.id, label: course.label }))}
        />

        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Certificate Record</CardTitle>
            <CardDescription>
              Snapshots are frozen at issuance, so later course or profile edits
              never change this document.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Student Name" value={certificate.studentName} />
            <Detail label="Student ID" value={certificate.studentId} mono />
            <Detail label="Course" value={certificate.courseName} />
            <Detail label="Certificate Title" value={certificate.certificateTitle ?? "—"} />
            <Detail label="Certificate Number" value={certificate.certificateNumber} mono />
            <Detail label="Verification Code" value={certificate.verificationCode} mono />
            <Detail label="Issue Date" value={formatDate(certificate.issueDate)} />
            <Detail label="Completion Date" value={formatDate(certificate.completionDate)} />
            <Detail label="Grade / Score" value={certificate.grade ?? "—"} />
            <Detail label="Status" value={certificate.status === "issued" ? "Active" : "Revoked"} />
            <Detail label="Created At" value={formatDate(certificate.createdAt)} />
            <Detail label="Last Updated" value={formatDate(certificate.updatedAt)} />
            <Detail label="File Type" value={certificate.fileType ?? "—"} />
            <Detail
              label="File Size"
              value={certificate.fileSize ? formatBytes(certificate.fileSize) : "—"}
            />
            <Detail label="Original File Name" value={certificate.originalFileName ?? "—"} />
            {certificate.replacedAt ? (
              <Detail label="File Replaced" value={formatDate(certificate.replacedAt)} />
            ) : null}
            {certificate.restoredAt ? (
              <Detail label="Reactivated" value={formatDate(certificate.restoredAt)} />
            ) : null}
          </CardContent>
        </Card>

        {certificate.notes ? (
          <Card className="rounded-2xl border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base">Internal Notes</CardTitle>
              <CardDescription>
                Visible to office staff only — never to students and never on the
                public verification page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {certificate.notes}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Certificate File</CardTitle>
            <CardDescription>
              Served through an authenticated route — the storage location is
              never exposed to the browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- streamed from an authenticated API route
              <img
                src={`/api/office/certificates/${certificate.id}/file`}
                alt={`Certificate ${certificate.certificateNumber}`}
                className="mx-auto max-h-[70vh] w-auto rounded-xl border border-slate-200"
              />
            ) : (
              <iframe
                title={`Certificate ${certificate.certificateNumber}`}
                src={`/api/office/certificates/${certificate.id}/file`}
                className="h-[70vh] w-full rounded-xl border border-slate-200"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-slate-900 ${mono ? "break-all font-mono text-xs" : "text-sm"}`}>
        {value}
      </p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
