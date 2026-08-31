import { siteConfig } from "@/lib/config/site";

/**
 * Builds the canonical public verification URL for a certificate.
 *
 * The QR code on a printed certificate, the "Verify" buttons, and any
 * certificate emails all go through this single helper so URL construction is
 * never duplicated. Uses the centralized public base URL
 * (`NEXT_PUBLIC_APP_URL`) and trims trailing slashes safely.
 */
export function getCertificateVerificationUrl(verificationCode: string): string {
  const base = siteConfig.url.replace(/\/+$/, "");
  return `${base}/verify-certificate/${encodeURIComponent(verificationCode)}`;
}