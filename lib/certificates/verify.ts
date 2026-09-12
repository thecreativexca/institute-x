import "server-only";

import { connectDB } from "@/lib/db/connect";
import { CERTIFICATE_STATUSES } from "@/lib/constants";
import { siteConfig } from "@/lib/config/site";
import { Certificate } from "@/models/Certificate";
import type { PublicVerificationResult } from "@/types/certificate";

/**
 * Public certificate verification (spec §28–§31, §46, §56).
 *
 * Read-only. Never writes/modifies anything. Uses strict indexed lookups on
 * `verificationCode` / `certificateNumber` and returns only the minimal public
 * snapshot — no emails, ids, metadata or internal fields.
 *
 * Query normalization (spec §56): trim whitespace and normalize casing. We
 * match verification codes and certificate numbers case-insensitively against
 * the stored normalized value via an exact query (no untrusted regex / Mongo
 * operator injection — the input is used only as a plain string in a fixed
 * $or build).
 */

/** Normalizes a verification input; returns null when it is empty/unsafe. */
export function normalizeVerificationInput(raw: string): string | null {
  const normalized = raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 64);
  if (!normalized) return null;
  return normalized;
}

export async function verifyCertificate(
  rawIdentifier: string
): Promise<PublicVerificationResult> {
  const normalized = normalizeVerificationInput(rawIdentifier);
  if (!normalized) {
    return { status: "not_found" };
  }

  await connectDB();

  // Read query only against the two indexed fields.
  // The `select` is an explicit allow-list: personal data (email, phone,
  // address), internal Mongo ids, admin notes and payment fields are never even
  // loaded, so they cannot leak into a public response by accident.
  const cert = await Certificate.findOne({
    $or: [{ verificationCode: normalized }, { certificateNumber: normalized }],
  })
    .select(
      "status certificateNumber verificationCode certificateTitle studentNameSnapshot courseNameSnapshot issuedAt completionDate revokedAt"
    )
    .lean();

  if (!cert) {
    return { status: "not_found" };
  }

  if (cert.status === CERTIFICATE_STATUSES.REVOKED) {
    return {
      status: "revoked",
      certificateNumber: cert.certificateNumber,
      certificateTitle: cert.certificateTitle ?? null,
      revokedAt: cert.revokedAt?.toISOString() ?? null,
    };
  }

  return {
    status: "valid",
    studentName: cert.studentNameSnapshot,
    courseName: cert.courseNameSnapshot,
    certificateTitle: cert.certificateTitle ?? null,
    certificateNumber: cert.certificateNumber,
    issueDate: cert.issuedAt.toISOString(),
    // Optional for admin-uploaded certificates.
    completionDate: cert.completionDate?.toISOString() ?? null,
    instituteName: siteConfig.name,
  };
}