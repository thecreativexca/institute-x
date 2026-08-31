import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { verifyCertificate } from "@/lib/certificates/verify";
import { VerificationResultCard } from "@/components/certificates/verification-result";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ verificationCode: string }> };

// Direct verification links always stay out of search indexes (spec §36).
export function generateMetadata(): Promise<Metadata> | Metadata {
  return {
    title: "Certificate Verification",
    description: "Verify a certificate issued by the institute.",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyCertificateResultPage({ params }: RouteParams) {
  const { verificationCode } = await params;
  const result = await verifyCertificate(verificationCode);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center px-4 py-12">
      <div className="mb-8 text-center">
        <img
          src={siteConfig.logo}
          alt={`${siteConfig.name} logo`}
          className="mx-auto mb-4 h-16 w-16"
        />
        <h1 className="text-3xl font-bold text-slate-900">Certificate Verification</h1>
        <p className="mt-2 text-slate-600">
          Verification result for a certificate issued by {siteConfig.name}.
        </p>
      </div>

      <div className="w-full space-y-6">
        <VerificationResultCard result={result} />
        <p className="text-center">
          <Link href="/verify-certificate" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Verify another certificate
          </Link>
        </p>
      </div>
    </main>
  );
}