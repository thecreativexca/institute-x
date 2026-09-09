import { randomInt } from "node:crypto";

import { connectDB } from "@/lib/db/connect";
import { siteConfig } from "@/lib/config/site";
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
