import { format } from "date-fns";

import { siteConfig } from "@/lib/config/site";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicVerificationResult } from "@/types/certificate";
import { ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";

/**
 * Public certificate verification result card. Used by both the interactive
 * verification page and the direct `/verify-certificate/[code]` link. Shows
 * only the minimal public information (spec §37–§38) — never emails, ids or
 * internal fields.
 */
export function VerificationResultCard({
  result,
}: {
  result: PublicVerificationResult;
}) {
  if (result.status === "not_found") {
    return (
      <Card className="border-red-200">
        <CardHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-7 w-7 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Certificate Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-slate-600">
          <p>No matching certificate was found for the identifier you entered.</p>
          <p className="mt-2 text-sm text-slate-500">
            Check the certificate number or verification code and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "revoked") {
    return (
      <Card className="border-red-200">
        <CardHeader className="items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-7 w-7 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Certificate Revoked</CardTitle>
          <Badge variant="danger">Revoked</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          <p className="font-medium text-slate-900">{result.certificateNumber}</p>
          {result.certificateTitle ? (
            <p className="text-sm text-slate-700">{result.certificateTitle}</p>
          ) : null}
          <p className="text-sm text-slate-600">
            This certificate has been revoked and is no longer valid.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <ShieldCheck className="h-7 w-7 text-amber-700" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">✓ Certificate Verified</CardTitle>
        <Badge variant="success">Valid</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Institute</dt>
            <dd className="font-medium text-slate-900">{result.instituteName ?? siteConfig.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Certificate Holder</dt>
            <dd className="font-medium text-slate-900">{result.studentName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Certificate</dt>
            <dd className="text-slate-900">
              {result.certificateTitle ?? result.courseName}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Course</dt>
            <dd className="text-slate-900">{result.courseName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Certificate Number</dt>
            <dd className="font-mono text-slate-900">{result.certificateNumber}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Completed On</dt>
            <dd className="text-slate-900">
              {result.completionDate ? format(new Date(result.completionDate), "d MMM yyyy") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Issued On</dt>
            <dd className="text-slate-900">
              {result.issueDate ? format(new Date(result.issueDate), "d MMM yyyy") : "—"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}