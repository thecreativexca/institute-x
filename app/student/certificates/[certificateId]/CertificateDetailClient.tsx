"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkWrapper } from "@/components/ui/link-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import type { CertificateDetail } from "@/types/certificate";
import { ArrowLeft, Award, Copy, Check, Download, ExternalLink, Eye } from "lucide-react";

interface Props {
  detail: CertificateDetail;
  previewUrl: string;
}

function formatDate(iso: string): string {
  return format(new Date(iso), "d MMMM yyyy");
}

export function CertificateDetailClient({ detail, previewUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);

  const onCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(detail.verificationUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [detail.verificationUrl]);

  const isRevoked = detail.status === "revoked";

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <LinkWrapper
            href="/student/certificates"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Certificates
          </LinkWrapper>
          {isRevoked ? (
            <Badge variant="danger">
              <span aria-hidden="true" className="mr-1">•</span> Revoked
            </Badge>
          ) : (
            <Badge variant="success">
              <Check className="mr-1 h-3 w-3" aria-hidden="true" /> Valid
            </Badge>
          )}
        </div>

        <Card className="overflow-hidden rounded-2xl border-primary-100">
          <CardHeader className="border-b border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Award className="h-6 w-6 text-emerald-700" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle>{detail.courseName}</CardTitle>
                  <CardDescription>Official Certificate of Completion</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <a href={`/api/student/certificates/${detail.id}/download`}>
                    <Download className="h-4 w-4" aria-hidden="true" /> Download PDF
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open PDF
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Certificate Holder</p>
              <p className="font-medium text-slate-900">{detail.studentName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Certificate Number</p>
              <p className="font-mono text-slate-900">{detail.certificateNumber}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Completed On</p>
              <p className="text-slate-900">{formatDate(detail.completionDate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Issued On</p>
              <p className="text-slate-900">{formatDate(detail.issuedAt)}</p>
            </div>
          </CardContent>
        </Card>
{/* Public verification */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle className="text-base">Public Verification</CardTitle>
            <CardDescription>Share this link to let anyone verify your certificate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="break-all rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 font-mono text-xs text-slate-600">
              {detail.verificationUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <LinkWrapper href={detail.verificationUrl}>
                  <Eye className="h-4 w-4" aria-hidden="true" /> View Verification Page
                </LinkWrapper>
              </Button>
              <Button onClick={onCopyLink} variant="secondary" size="sm">
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? "Copied!" : "Copy Verification Link"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PDF preview */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle className="text-base">Certificate Preview</CardTitle>
            <CardDescription>Selectable, print-friendly PDF of your certificate.</CardDescription>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <Skeleton className="aspect-[297/210] w-full" />
            ) : null}
            <iframe
              title={`Certificate — ${detail.courseName}`}
              src={previewUrl}
              className="h-[70vh] w-full rounded-xl border border-primary-100"
              onLoad={() => setPreviewLoading(false)}
            />
            {isRevoked ? (
              <Alert className="mt-4" variant="destructive">
                This certificate has been revoked and is no longer valid.
              </Alert>
            ) : (
              <Alert className="mt-4" variant="success">
                Your certificate is valid and publicly verifiable.
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
