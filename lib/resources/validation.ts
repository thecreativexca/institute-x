import { z } from "zod";

import { env } from "@/lib/config/env";
import {
  ALLOWED_RESOURCE_MIME_TYPES,
  RESOURCE_ACCESS,
  RESOURCE_TYPES,
  type ResourceAccess,
  type ResourceType,
} from "@/lib/constants";
import { objectIdSchema } from "@/lib/validations/common";
import { RESOURCE_ERROR, ResourceError } from "./errors";

/**
 * Literal tuple of access values for zod schemas. Kept as a typed tuple so
 * zod infers the precise union (not widened to string) and stays in sync
 * with the RESOURCE_ACCESS constants at compile time.
 */
const RESOURCE_ACCESS_TUPLE = [
  RESOURCE_ACCESS.VIEW_AND_DOWNLOAD,
  RESOURCE_ACCESS.VIEW_ONLY,
  RESOURCE_ACCESS.PRIVATE,
] as const satisfies readonly ResourceAccess[];

/* ------------------------------ Input schemas ----------------------------- */

export const resourceIdParamSchema = z.object({ resourceId: objectIdSchema });

export const lessonIdParamSchema = z.object({ lessonId: objectIdSchema });

/** Shared course/module/lesson triple submitted with an upload. */
export const resourcePlacementSchema = z.object({
  courseId: objectIdSchema,
  moduleId: objectIdSchema,
  lessonId: objectIdSchema,
});

export const resourceUploadMetaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional(),
  access: z.enum(RESOURCE_ACCESS_TUPLE).default(RESOURCE_ACCESS.VIEW_AND_DOWNLOAD),
  isPublished: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export const resourceUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    access: z.enum(RESOURCE_ACCESS_TUPLE).optional(),
    isPublished: z.boolean().optional(),
    order: z.number().int().min(0).max(999).optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "No changes provided" }
  );

export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;

/* --------------------------- File name sanitizing -------------------------- */

/**
 * Produces a safe, human-readable base name from a display title.
 * The ORIGINAL FILENAME IS NEVER TRUSTED — it is only ever stored for
 * display purposes, while this sanitized slug drives the Cloudinary
 * public_id (preventing path traversal or folder manipulation).
 */
export function sanitizePublicIdBase(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    // Strip accents/diacritics
    .replace(/[\u0300-\u036f]/g, "")
    // Collapse everything that is not a lowercase word character into "-"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "resource";
}

/** Trims a stored display filename to a sane length without leaking paths. */
export function sanitizeOriginalFileName(fileName: string): string {
  // Take only the final path segment, then cap the length.
  const segment = fileName.split(/[\\/]/).pop() ?? "";
  return segment.slice(0, 200) || "upload";
}

/* ------------------------------ File validation ---------------------------- */

/** Maps an allowed MIME type to a resource type and canonical extension. */
const MIME_METADATA: Record<
  string,
  { type: ResourceType; extension: string; label: string }
> = {
  "application/pdf": {
    type: RESOURCE_TYPES.PDF,
    extension: "pdf",
    label: "PDF",
  },
  "application/msword": {
    type: RESOURCE_TYPES.DOCUMENT,
    extension: "doc",
    label: "DOC",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    type: RESOURCE_TYPES.DOCUMENT,
    extension: "docx",
    label: "DOCX",
  },
  "text/plain": {
    type: RESOURCE_TYPES.DOCUMENT,
    extension: "txt",
    label: "TXT",
  },
};

export function getAllowedExtensions(): string[] {
  return Object.values(MIME_METADATA).map((meta) => meta.extension);
}

/** Canonical file extension for a whitelisted MIME type (else null). */
export function extensionForMime(mimeType: string): string | null {
  return MIME_METADATA[mimeType]?.extension ?? null;
}

/** True when the browser-reported MIME type is explicitly whitelisted. */
export function isMimeAllowed(mimeType: string): boolean {
  return (ALLOWED_RESOURCE_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Files must carry a whitelisted extension too — MIME alone is not enough. */
function isExtensionAllowed(fileName: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return getAllowedExtensions().includes(extension);
}

/**
 * Best-effort content sniffing. Magic bytes are checked for binary formats;
 * plain text is verified as UTF-8/ASCII printable. This complements (never
 * replaces) the MIME + extension whitelist.
 */
function contentMatchesMime(bytes: Uint8Array, mimeType: string): boolean {
  // %PDF-
  if (mimeType === "application/pdf") {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  }
  // OLE2 compound document (legacy .doc): D0 CF 11 E0 A1 B1 1A E1
  if (mimeType === "application/msword") {
    return (
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0 &&
      bytes[4] === 0xa1 &&
      bytes[5] === 0xb1 &&
      bytes[6] === 0x1a &&
      bytes[7] === 0xe1
    );
  }
  // OOXML (docx) is a ZIP container: PK\x03\x04
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes.length >= 4;
  }
  // text/plain: reject NUL bytes and too much non-printable content.
  if (mimeType === "text/plain") {
    const sample = bytes.subarray(0, 1024);
    let suspicious = 0;
    for (const byte of sample) {
      if (byte === 0) return false;
      if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) suspicious += 1;
    }
    return suspicious / Math.max(sample.length, 1) < 0.1;
  }
  return false;
}

export interface ValidatedResourceFile {
  buffer: Buffer;
  mimeType: string;
  resourceType: ResourceType;
  extension: string;
  sizeLabel: string;
  originalFileName: string;
}

/**
 * Validates an uploaded file end-to-end:
 *   1. present and non-empty
 *   2. size within the configured limit
 *   3. MIME type whitelisted (extension must agree)
 *   4. magic bytes / content match the claimed type
 */
export async function validateResourceFile(file: File): Promise<ValidatedResourceFile> {
  if (!file || typeof file !== "object" || file.size === undefined) {
    throw new ResourceError(RESOURCE_ERROR.FILE_REQUIRED, "Please choose a file to upload.");
  }

  if (file.size === 0) {
    throw new ResourceError(RESOURCE_ERROR.FILE_EMPTY, "The selected file is empty.");
  }

  if (file.size > env.maxResourceFileSizeBytes) {
    throw new ResourceError(
      RESOURCE_ERROR.FILE_TOO_LARGE,
      `Files must be ${env.maxResourceFileSizeMB} MB or smaller.`
    );
  }

  const mimeType = (file.type || "").toLowerCase();
  if (!isMimeAllowed(mimeType) || !isExtensionAllowed(file.name)) {
    throw new ResourceError(
      RESOURCE_ERROR.FILE_TYPE_INVALID,
      "Only PDF, DOC, DOCX and TXT files are allowed."
    );
  }

  const metadata = MIME_METADATA[mimeType];

  // Capped-size file read via the async web API.
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength !== file.size) {
    throw new ResourceError(
      RESOURCE_ERROR.FILE_REQUIRED,
      "The uploaded file could not be read. Please try again."
    );
  }

  if (!contentMatchesMime(buffer, mimeType)) {
    throw new ResourceError(
      RESOURCE_ERROR.FILE_TYPE_INVALID,
      "The file content does not match its type. Please upload a valid document."
    );
  }

  return {
    buffer,
    mimeType,
    resourceType: metadata.type,
    extension: metadata.extension,
    sizeLabel: metadata.label,
    originalFileName: sanitizeOriginalFileName(file.name),
  };
}