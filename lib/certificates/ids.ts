import { randomInt } from "node:crypto";

import { connectDB } from "@/lib/db/connect";
import { siteConfig } from "@/lib/config/site";
import {
  CERTIFICATE_NUMBER_MAX_LENGTH,
  CERTIFICATE_TYPES,
} from "@/lib/constants";
import { CertificateSequence } from "@/models/CertificateSequence";

/**
 * Identifier generation for certificates.
 *
 * Two deliberately separate identifiers (spec §6–§8):
 *   - certificateNumber — human-readable, sequential, stable official number,
 *     backed by an atomic counter (see `nextCertificateSequenceValue`).
 *   - verificationCode — high-entropy, non-sequential, cryptographically random
 *     token used for public verification links. NEVER derived from
 *     Math.random() and never guessable from the certificate number.
 */

/** Alphabet with visually ambiguous characters removed (0/O, 1/I/L…). */
const VERIFICATION_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const VERIFICATION_GROUP_SIZE = 4;
const VERIFICATION_GROUPS = 3;

/** Cryptographically-random verification code, e.g. "8F3K-91PQ-X7LM". */
export function generateVerificationCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < VERIFICATION_GROUPS; g += 1) {
    let group = "";
    for (let i = 0; i < VERIFICATION_GROUP_SIZE; i += 1) {
      const idx = randomInt(VERIFICATION_ALPHABET.length);
      group += VERIFICATION_ALPHABET[idx];
    }
    groups.push(group);
  }
  return groups.join("-");
}

function padNumber(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

/**
 * Atomically reserves the next certificate number sequence value for a given
 * (type, year). Uses an upsert + `$inc` against a unique `(type, year)` counter
 * document so concurrent requests cannot receive the same number (spec §51).
 */
export async function nextCertificateSequenceStep(
  certificateType: string,
  year: number
): Promise<number> {
  await connectDB();
  const doc = await CertificateSequence.findOneAndUpdate(
    { type: certificateType, year },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return doc?.value ?? 1;
}

/** Human-readable official number, e.g. "INST-2026-CN-000001". */
export function buildCertificateNumber(
  sequenceValue: number,
  year: number,
  certificateType: string
): string {
  if (certificateType === "internship") return `INT-${year}-${padNumber(sequenceValue, 6)}`;
  const prefix = siteConfig.certificate.prefix ?? "INST";
  const typeCode = siteConfig.certificate.typeCode ?? "CN";
  return `${prefix}-${year}-${typeCode}-${padNumber(sequenceValue, 6)}`;
}

/**
 * Official number for an admin-issued (uploaded) certificate.
 * Shorter than the generated form because there is no type code to encode:
 *   "CXT-2026-000123"
 */
export function buildManualCertificateNumber(
  sequenceValue: number,
  year: number
): string {
  const prefix = siteConfig.certificate.prefix ?? "INST";
  return `${prefix}-${year}-${padNumber(sequenceValue, 6)}`;
}

/**
 * Normalizes an admin-entered certificate number: trims, collapses internal
 * whitespace and upper-cases it so lookups and the unique index behave
 * consistently ("cxt-2026-000123" and " CXT 2026 000123 " both fold to
 * "CXT-2026-000123"). Returns "" for empty input.
 */
export function normalizeCertificateNumber(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, CERTIFICATE_NUMBER_MAX_LENGTH);
}

/**
 * Format check for an admin-entered number. Deliberately permissive about the
 * prefix (institutes rename themselves) but strict about the character set so
 * nothing unsafe reaches storage, URLs or the public verification lookup:
 * letters, digits and single hyphens only.
 */
export function isValidCertificateNumberFormat(value: string): boolean {
  return /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(value) && value.length >= 4;
}

/**
 * Atomically reserves the next sequence value and formats an official number
 * for an admin-uploaded certificate. Used by the "Generate certificate number"
 * action. Uniqueness is still enforced by the unique index on
 * `certificateNumber` + a pre-check in the service.
 */
export async function generateManualCertificateNumber(
  year = new Date().getFullYear()
): Promise<string> {
  const step = await nextCertificateSequenceStep(
    CERTIFICATE_TYPES.MANUAL_UPLOAD,
    year
  );
  return buildManualCertificateNumber(step, year);
}
