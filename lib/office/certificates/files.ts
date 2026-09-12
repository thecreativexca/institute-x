import "server-only";

import {
  ALLOWED_CERTIFICATE_EXTENSIONS,
  ALLOWED_CERTIFICATE_MIME_TYPES,
} from "@/lib/constants";
import { env } from "@/lib/config/env";

import { CertificateError, CERTIFICATE_ERROR } from "@/lib/certificates/errors";

/**
 * Admin certificate file validation.
 *
 * Layered, in this order (cheapest first):
 *   1. present and non-empty
 *   2. size within the configured cap (default 10 MB)
 *   3. MIME type whitelisted AND the extension agrees with it
 *   4. magic bytes match the claimed type
 *
 * The original filename is NEVER trusted: it is only stored for display, while
 * the Cloudinary public_id is derived from the (validated) certificate number.
 */

/** Canonical extension for each allowed MIME type. */
const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** Extensions that legitimately map to a given MIME type (aliases allowed). */
const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
};

export function getAllowedCertificateExtensions(): string[] {
  return [...ALLOWED_CERTIFICATE_EXTENSIONS];
}

/** Canonical extension for a whitelisted MIME type, else null. */
export function certificateExtensionForMime(mimeType: string): string | null {
  return MIME_TO_EXTENSION[mimeType] ?? null;
}

export function isCertificateMimeAllowed(mimeType: string): boolean {
  return (ALLOWED_CERTIFICATE_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Lower-cased final extension of an upload, without the dot. */
export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/** Strips any directory component so a crafted name cannot leak a path. */
export function sanitizeOriginalFileName(fileName: string): string {
  const segment = fileName.split(/[\\/]/).pop() ?? "";
  return segment.slice(0, 200) || "certificate";
}

/**
 * Magic-byte check. `%PDF-` for PDFs; JPEG (FF D8 FF) and PNG
 * (89 50 4E 47 0D 0A 1A 0A) signatures for images. This complements the MIME +
 * extension whitelist and is what actually rejects a renamed .exe.
 */
function contentMatchesMime(bytes: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case "application/pdf":
      return (
        bytes[0] === 0x25 && // %
        bytes[1] === 0x50 && // P
        bytes[2] === 0x44 && // D
        bytes[3] === 0x46 // F
      );
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 && // P
        bytes[2] === 0x4e && // N
        bytes[3] === 0x47 && // G
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    default:
      return false;
  }
}

export interface ValidatedCertificateFile {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  originalFileName: string;
  size: number;
}

/**
 * Validates an uploaded certificate file end-to-end.
 * Throws a CertificateError (mapped to a 4xx by the caller) on any failure.
 */
export async function validateCertificateFile(
  file: unknown
): Promise<ValidatedCertificateFile> {
  if (!(file instanceof File) || typeof file.size !== "number") {
    throw new CertificateError(
      CERTIFICATE_ERROR.INVALID_FILE,
      "Please choose a certificate file to upload.",
      400
    );
  }

  if (file.size === 0) {
    throw new CertificateError(
      CERTIFICATE_ERROR.INVALID_FILE,
      "The selected file is empty.",
      400
    );
  }

  const maxBytes = env.maxCertificateFileSizeBytes;
  if (file.size > maxBytes) {
    throw new CertificateError(
      CERTIFICATE_ERROR.FILE_TOO_LARGE,
      `Files must be ${env.maxCertificateFileSizeMB} MB or smaller.`,
      413
    );
  }

  const mimeType = (file.type || "").toLowerCase();
  const extension = getFileExtension(file.name);

  const allowedExtensions = MIME_TO_EXTENSIONS[mimeType];
  if (!isCertificateMimeAllowed(mimeType) || !allowedExtensions?.includes(extension)) {
    throw new CertificateError(
      CERTIFICATE_ERROR.INVALID_FILE_TYPE,
      "Only PDF, JPG, JPEG and PNG files are allowed.",
      400
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength !== file.size) {
    throw new CertificateError(
      CERTIFICATE_ERROR.INVALID_FILE,
      "The uploaded file could not be read. Please try again.",
      400
    );
  }

  if (!contentMatchesMime(buffer, mimeType)) {
    throw new CertificateError(
      CERTIFICATE_ERROR.INVALID_FILE_TYPE,
      "The file content does not match its type. Please upload a valid PDF or image.",
      400
    );
  }

  return {
    buffer,
    mimeType,
    extension: certificateExtensionForMime(mimeType) ?? extension,
    originalFileName: sanitizeOriginalFileName(file.name),
    size: file.size,
  };
}
