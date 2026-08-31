"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { LinkWrapper } from "@/components/ui/link-button";
import { Award, Download, Eye, CheckCircle2, GraduationCap, ChevronRight } from "lucide-react";
import { GenerateCertificateButton } from "./GenerateCertificateButton";
import type { CertificateListItem, EligibleEnrollment } from "@/types/certificate";

interface Props {
  certificates: CertificateListItem[];
  eligible: EligibleEnrollment[];
}

/** Accessible certificate status badge — text + icon, never color-only (§53). */
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

export function StudentCertificatesClient({ certificates, eligible }: Props) {
  const hasCertificates = certificates.length > 0;
  const hasEligible = eligible.length > 0;

  return (
      <div className="space-y-6">
        <StudentPageHeader
          title="Certificates"
          description="Generate, download and verify your official course achievements."
          icon={<Award className="h-6 w-6" aria-hidden="true" />}
          eyebrow="Your achievements"
        />

        {/* Certificate-ready enrollments not yet issued */}
        {hasEligible ? (
          <Card className="rounded-2xl border-accent-200 bg-accent-50/70">
            <CardHeader>
              <CardTitle className="text-base">Certificates Ready to Generate</CardTitle>
              <CardDescription className="text-xs">
                You completed these courses — generate your official certificate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eligible.map((item) => (
                <div
                  key={item.enrollmentId}
                  className="flex flex-col gap-3 rounded-xl border border-accent-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{item.courseName}</p>
                    <p className="text-xs text-slate-500">
                      Completed {formatDate(item.completionDate)}
                    </p>
                  </div>
                  <GenerateCertificateButton enrollmentId={item.enrollmentId} />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
{/* Earned certificates */}
        {hasCertificates ? (
          <Card className="rounded-2xl border-primary-100">
            <CardHeader>
              <CardTitle>Earned Certificates</CardTitle>
              <CardDescription>Official certificates issued for completed courses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/40 p-4 transition-colors hover:border-primary-200 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Award className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{cert.courseName}</p>
                      <p className="text-sm text-slate-500">{cert.certificateNumber}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Issued {formatDate(cert.issuedAt)} · Completed {formatDate(cert.completionDate)}
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
                    <Button asChild variant="secondary" size="sm">
                      <a href={`/api/student/certificates/${cert.id}/download`}>
                        <Download className="h-4 w-4" aria-hidden="true" /> Download
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <LinkWrapper href={`/verify-certificate/${cert.verificationCode}`}>
                        Verify
                      </LinkWrapper>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : !hasEligible ? (
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="py-8">
              <EmptyState
                icon={<Award className="h-12 w-12" aria-hidden="true" />}
                title="You haven't earned any certificates yet."
                description="Complete your course requirements to earn certificates."
                action={
                  <Button asChild>
                    <LinkWrapper href="/student/progress">
                      <GraduationCap className="h-4 w-4" aria-hidden="true" />
                      View My Progress
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </LinkWrapper>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
  );
}
