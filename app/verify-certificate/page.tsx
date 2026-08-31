import type { Metadata } from "next";

import { siteConfig } from "@/lib/config/site";
import { VerifyCertificateClient } from "./VerifyCertificateClient";

export const metadata: Metadata = {
  title: "Certificate Verification",
  description: "Verify the authenticity of a certificate issued by the institute.",
};

/**
 * Public certificate verification landing (spec §27, §55).
 * Accepts a certificate number OR verification code through an interactive
 * form. Result data comes only from the read-only verification service.
 */
export default function VerifyCertificatePage() {
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
          Verify the authenticity of a certificate issued by {siteConfig.name}.
        </p>
      </div>
      <VerifyCertificateClient />
    </main>
  );
}