"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { LinkWrapper } from "@/components/ui/link-button";
import { Award, Download, Eye, CheckCircle2, Image as ImageIcon } from "lucide-react";
import type { CertificateListItem } from "@/types/certificate";

interface Props {
  certificates: CertificateListItem[];
}

/** Accessible certificate status badge — text + icon, never color-only. */
function StatusBadge({ status }: { status: CertificateListItem["status"] }) {
  if (status === "revoked") {
    return (
      <Badge variant="danger">
        <span aria-hidden="true" className="mr-1">•</span> Revoked
      </Badge>
    );
  }
  return (
    <Badge variant="success">
      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" /> Valid
    </Badge>
  );
}

function formatDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}

/**
 * Student-facing certificate list (spec §5).
 *
 * Deliberately VIEW / DOWNLOAD / VERIFY only — no edit or delete control exists
 * anywhere on this screen, because a certificate is an institute-issued
 * document. Downloads are disabled for revoked certificates.
 */
export function StudentCertificatesClient({ certificates }: Props) {
  const [certificateFilter, setCertificateFilter] = useState<"course" | "internship">("course");
  const visibleCertificates = certificates.filter((certificate) =>
    certificateFilter === "internship"
      ? certificate.certificateType === "internship"
      : certificate.certificateType !== "internship"
  );
  const hasCertificates = certificates.length > 0;

  return (
    <div className="space-y-6">
      <StudentPageHeader
        title="My Certificates"
        description="Certificates issued to you by the institute. View, download or share the public verification link."
        icon={<Award className="h-6 w-6" aria-hidden="true" />}
        eyebrow="Your achievements"
      />

      {hasCertificates ? (
        <div className="flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setCertificateFilter("course")}
            className={`border-b-2 px-3 py-2 text-sm ${certificateFilter === "course" ? "border-primary-600 font-semibold text-primary-800" : "border-transparent text-slate-500"}`}
          >
            Course Certificates
          </button>
          <button
            type="button"
            onClick={() => setCertificateFilter("internship")}
            className={`border-b-2 px-3 py-2 text-sm ${certificateFilter === "internship" ? "border-primary-600 font-semibold text-primary-800" : "border-transparent text-slate-500"}`}
          >
            Internship Certificates
          </button>
        </div>
      ) : null}

      {hasCertificates ? (
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Issued Certificates</CardTitle>
            <CardDescription>
              Official certificates issued to you by the institute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleCertificates.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No {certificateFilter} certificates yet.
              </p>
            ) : null}

            {visibleCertificates.map((cert) => {
              const isRevoked = cert.status === "revoked";
              const isImage = cert.fileType?.startsWith("image/") ?? false;

              return (
                <div
                  key={cert.id}
                  className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-4 transition-colors hover:border-primary-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      {isImage ? (
                        <ImageIcon className="h-6 w-6 text-amber-800" aria-hidden="true" />
                      ) : (
                        <Award className="h-6 w-6 text-amber-800" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {cert.certificateTitle ?? cert.courseName}
                      </p>
                      <p className="text-sm text-slate-500">{cert.certificateNumber}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Issued {formatDate(cert.issuedAt)}
                        {cert.completionDate
                          ? ` · Completed ${formatDate(cert.completionDate)}`
                          : ""}
                        {cert.grade ? ` · Grade ${cert.grade}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={cert.status} />
                    <Button asChild variant="outline" size="sm">
                      <LinkWrapper href={`/student/certificates/${cert.id}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" /> View
                      </LinkWrapper>
                    </Button>
                    {isRevoked ? (
                      <Button variant="secondary" size="sm" disabled title="Revoked certificates cannot be downloaded">
                        <Download className="h-4 w-4" aria-hidden="true" /> Download
                      </Button>
                    ) : (
                      <Button asChild variant="secondary" size="sm">
                        <a href={`/api/student/certificates/${cert.id}/download`}>
                          <Download className="h-4 w-4" aria-hidden="true" /> Download
                        </a>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <LinkWrapper href={`/verify-certificate/${cert.certificateNumber}`}>
                        Verify
                      </LinkWrapper>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-primary-100">
          <CardContent className="py-8">
            <EmptyState
              icon={<Award className="h-12 w-12" aria-hidden="true" />}
              title="No certificates issued yet."
              description="Your certificates will appear here once they are issued by the institute."
              action={
                <Button asChild>
                  <LinkWrapper href="/student/progress">View My Progress</LinkWrapper>
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
