import { z } from "zod";

import {
  CERTIFICATE_GRADE_MAX_LENGTH,
  CERTIFICATE_NOTES_MAX_LENGTH,
  CERTIFICATE_NUMBER_MAX_LENGTH,
  CERTIFICATE_REVOCATION_REASON_MAX_LENGTH,
  CERTIFICATE_TITLE_MAX_LENGTH,
} from "@/lib/constants";
import { objectIdSchema } from "@/lib/validations/common";

import {
  isValidCertificateNumberFormat,
  normalizeCertificateNumber,
} from "@/lib/certificates/ids";

/**
 * Input schemas for the admin Certificate Management module.
 *
 * Every schema is applied SERVER-SIDE on data that arrived from the browser;
 * nothing here is a client-only convenience. Identity fields (`studentId`,
 * `courseId`) are validated as real ObjectIds but their *existence* and
 * relationship are re-checked against the database in the service layer.
 */

/* ------------------------------- Primitives ------------------------------- */

/**
 * Admin-entered certificate number. Normalized (trim / upper-case / hyphenated)
 * and format-checked so it is safe for storage, URLs and the public
 * verification lookup. Uniqueness is enforced by the service + unique index.
 */
export const certificateNumberSchema = z
  .string()
  .trim()
  .min(1, "Certificate number is required")
  .max(CERTIFICATE_NUMBER_MAX_LENGTH, "Certificate number is too long")
  .transform(normalizeCertificateNumber)
  .refine(
    (value) => isValidCertificateNumberFormat(value),
    "Use letters, numbers and hyphens only (e.g. CXT-2026-000123)"
  );

/** Optional calendar date arriving as "YYYY-MM-DD" from <input type="date">. */
const optionalDateSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date")
  .transform((value) => new Date(value))
  .optional();

const requiredDateSchema = z
  .string()
  .trim()
  .min(1, "Issue date is required")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid issue date")
  .transform((value) => new Date(value));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

/* ----------------------------- Upload / create ---------------------------- */

export const certificateUploadSchema = z
  .object({
    studentId: objectIdSchema,
    /** Optional: a certificate may be issued without a catalogue course. */
    courseId: objectIdSchema.optional().or(z.literal("").transform(() => undefined)),
    certificateTitle: z
      .string()
      .trim()
      .min(1, "Certificate title is required")
      .max(CERTIFICATE_TITLE_MAX_LENGTH),
    certificateNumber: certificateNumberSchema,
    issueDate: requiredDateSchema,
    completionDate: optionalDateSchema,
    grade: optionalText(CERTIFICATE_GRADE_MAX_LENGTH),
    notes: optionalText(CERTIFICATE_NOTES_MAX_LENGTH),
  })
  .refine(
    (data) =>
      !data.completionDate ||
      data.completionDate.getTime() <= Date.now() + 86_400_000,
    { message: "Completion date cannot be in the future" }
  );

export type CertificateUploadInput = z.infer<typeof certificateUploadSchema>;

/* -------------------------------- Update --------------------------------- */

export const certificateUpdateSchema = z
  .object({
    certificateTitle: z
      .string()
      .trim()
      .min(1, "Certificate title is required")
      .max(CERTIFICATE_TITLE_MAX_LENGTH)
      .optional(),
    certificateNumber: certificateNumberSchema.optional(),
    courseId: z
      .union([objectIdSchema, z.literal("")])
      .optional()
      .transform((value) => (value === "" ? null : value)),
    courseName: optionalText(200),
    issueDate: optionalDateSchema,
    completionDate: z
      .union([z.string().trim().min(1), z.literal("")])
      .optional()
      .transform((value) => (value === "" || value === undefined ? undefined : new Date(value)))
      .refine(
        (value) => value === undefined || !Number.isNaN(value.getTime()),
        "Enter a valid completion date"
      ),
    grade: optionalText(CERTIFICATE_GRADE_MAX_LENGTH),
    notes: optionalText(CERTIFICATE_NOTES_MAX_LENGTH),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "No changes provided" }
  );

export type CertificateUpdateInput = z.infer<typeof certificateUpdateSchema>;

/* -------------------------- Revoke / reactivate --------------------------- */

export const certificateRevokeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Provide a short reason for revocation (at least 5 characters).")
    .max(
      CERTIFICATE_REVOCATION_REASON_MAX_LENGTH,
      "Reason is too long (max 500 characters)."
    ),
});

export const certificateReactivateSchema = z.object({
  note: optionalText(CERTIFICATE_REVOCATION_REASON_MAX_LENGTH),
});

/* -------------------------------- Filters -------------------------------- */

const CERTIFICATE_STATUS_FILTERS = ["ALL", "issued", "revoked"] as const;

/**
 * Admin list filters. Mirrors the `studentFiltersSchema` convention: unknown
 * values fall back to the safe default instead of throwing, so a hand-edited
 * query string can never 500 the page.
 */
export const certificateFiltersSchema = z.object({
  /** Free-text search across student name, student id and certificate number. */
  q: z.string().trim().max(120).optional(),
  studentId: objectIdSchema.optional(),
  courseId: objectIdSchema.optional(),
  status: z.enum(CERTIFICATE_STATUS_FILTERS).default("ALL"),
  /** Exact certificate-number lookup (normalized like the create path). */
  number: z.string().trim().max(CERTIFICATE_NUMBER_MAX_LENGTH).optional(),
  issuedFrom: z.string().trim().optional(),
  issuedTo: z.string().trim().optional(),
  sort: z.enum(["issuedAt", "createdAt", "certificateNumber", "studentName"]).default("issuedAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CertificateFiltersInput = z.infer<typeof certificateFiltersSchema>;

/** Param schema for every `/api/office/certificates/[certificateId]/*` route. */
export const certificateIdParamSchema = z.object({ certificateId: objectIdSchema });

/** Query schema for the student-search combobox. */
export const studentSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});
