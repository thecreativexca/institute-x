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
import {
  ArrowLeft,
  Award,
  Copy,
  Check,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
} from "lucide-react";

interface Props {
  detail: CertificateDetail;
  /** Ownership-checked API route that streams the file inline. */
  previewUrl: string;
  /** Ownership-checked API route that streams the file as a download. */
  downloadUrl: string;
}

function formatDate(iso: string): string {
  return format(new Date(iso), "d MMMM yyyy");
}

/**
 * Student certificate detail (spec §5, §6).
 *
 * VIEW / DOWNLOAD / VERIFY only — there is no edit or delete control, because
 * students cannot modify an institute-issued certificate. Both the preview and
 * the download go through authenticated API routes, so the storage URL is never
 * exposed to the browser, and a revoked certificate cannot be downloaded.
 */
export function CertificateDetailClient({ detail, previewUrl, downloadUrl }: Props) {
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
  const isImage = detail.fileType?.startsWith("image/") ?? false;
  const title = detail.certificateTitle ?? detail.courseName;
  const fileWord = isImage ? "Image" : "PDF";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <LinkWrapper
          href="/student/certificates"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Certificates
        </LinkWrapper>
        {isRevoked ? (
          <Badge variant="danger">
            <span aria-hidden="true" className="mr-1">•</span> Certificate Revoked
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                {isImage ? (
                  <ImageIcon className="h-6 w-6 text-amber-800" aria-hidden="true" />
                ) : (
                  <Award className="h-6 w-6 text-amber-800" aria-hidden="true" />
                )}
              </div>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  {detail.certificateTitle ? detail.courseName : "Official Certificate"}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isRevoked || !detail.hasFile ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  title={
                    isRevoked
                      ? "Revoked certificates cannot be downloaded"
                      : "No file is attached to this certificate"
                  }
                >
                  <Download className="h-4 w-4" aria-hidden="true" /> Download
                </Button>
              ) : (
                <Button asChild variant="secondary" size="sm">
                  <a href={downloadUrl}>
                    <Download className="h-4 w-4" aria-hidden="true" /> Download {fileWord}
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open in New Tab
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Student Name</p>
            <p className="font-medium text-slate-900">{detail.studentName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Course</p>
            <p className="font-medium text-slate-900">{detail.courseName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Certificate Number</p>
            <p className="font-mono text-slate-900">{detail.certificateNumber}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Issue Date</p>
            <p className="text-slate-900">{formatDate(detail.issuedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Completion Date</p>
            <p className="text-slate-900">
              {detail.completionDate ? formatDate(detail.completionDate) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Grade / Score</p>
            <p className="text-slate-900">{detail.grade ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
            <p className="text-slate-900">
              {isRevoked ? "Revoked — no longer valid" : "Valid"}
            </p>
          </div>
        </CardContent>
      </Card>

      {isRevoked ? (
        <Alert variant="destructive">
          <p className="font-semibold">Certificate Revoked</p>
          <p className="mt-1 text-sm">
            This certificate is no longer valid and can no longer be downloaded.
            {detail.revocationReason ? ` Reason: ${detail.revocationReason}` : ""}
          </p>
          {detail.revokedAt ? (
            <p className="mt-1 text-xs">Revoked on {formatDate(detail.revokedAt)}</p>
          ) : null}
        </Alert>
      ) : null}

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
              <LinkWrapper href={`/verify-certificate/${detail.certificateNumber}`}>
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

      {/* In-site preview */}
      <Card className="rounded-2xl border-primary-100">
        <CardHeader>
          <CardTitle className="text-base">Certificate Preview</CardTitle>
          <CardDescription>
            {isImage
              ? "Your certificate image, served securely to your account only."
              : "Print-friendly copy of your certificate, served securely to your account only."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRevoked ? (
            <Alert className="mb-4" variant="destructive">
              Preview unavailable — this certificate has been revoked.
            </Alert>
          ) : previewLoading ? (
            <Skeleton className="mb-4 aspect-[297/210] w-full" />
          ) : null}

          {!isRevoked && detail.hasFile ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- streamed from an authenticated API route, not a static asset
              <img
                src={previewUrl}
                alt={`Certificate ${detail.certificateNumber}`}
                className="mx-auto max-h-[70vh] w-auto rounded-xl border border-primary-100"
                onLoad={() => setPreviewLoading(false)}
                onError={() => setPreviewLoading(false)}
              />
            ) : (
              <iframe
                title={`Certificate ${detail.certificateNumber}`}
                src={previewUrl}
                className="h-[70vh] w-full rounded-xl border border-primary-100"
                onLoad={() => setPreviewLoading(false)}
              />
            )
          ) : null}

          {!isRevoked && !detail.hasFile ? (
            <Alert variant="destructive">
              No file is attached to this certificate. Please contact the institute.
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
