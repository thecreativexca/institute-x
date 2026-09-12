import type { Metadata } from "next";
import Link from "next/link";

import { ArrowLeft, Award } from "lucide-react";

import { OfficeShell } from "@/components/office/OfficeShell";
import { CertificateUploadForm } from "@/components/office/certificates/certificate-upload-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/helpers";

export const metadata: Metadata = {
  title: "Upload Certificate — Office Portal",
  description: "Issue a certificate to a student.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Upload Certificate (spec §2).
 *
 * Admin-only: `requireAdmin` redirects anyone else to the office login before
 * a single byte of this page is rendered. Students have no equivalent route —
 * they can only view, download and verify.
 */
export default async function UploadCertificatePage() {
  const { user } = await requireAdmin();
  if (!user) return null;

  return (
    <OfficeShell session={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/office/certificates">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Certificates
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
              <Award className="h-5 w-5 text-amber-800" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Upload Certificate
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Select a student, attach the certificate file, and it appears in
                their account immediately.
              </p>
            </div>
          </div>
        </header>

        <CertificateUploadForm />
      </div>
    </OfficeShell>
  );
}
