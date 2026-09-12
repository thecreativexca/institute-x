import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/config/env";

/**
 * Server-only Cloudinary utility for issued certificate PDFs.
 *
 * - Certificates are stored as raw documents under a logical tree:
 *     education-institute/certificates/{year}/{certificateNumber}/
 * - Paths only include the (public) year + certificate number — never personal
 *   identifiers such as email or MongoDB ids (spec §23).
 * - Configured from the same server env vars as learning resources.
 */

const CERTIFICATE_ROOT = "education-institute/certificates";

export interface CertificateUploadResult {
  publicId: string;
  fileUrl: string;
}

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  configured = true;
}

/** Builds a sanitized Cloudinary folder for a certificate. */
export function buildCertificateFolder(params: {
  year: number;
  certificateNumber: string;
}): string {
  const safeNumber = String(params.certificateNumber)
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 80);
  return [CERTIFICATE_ROOT, String(params.year), safeNumber].join("/");
}

/** Public id within the folder; identical to the certificate number. */
export function buildCertificatePublicId(certificateNumber: string): string {
  return String(certificateNumber)
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 80);
}

/** Uploads the generated (immutable) certificate PDF. */
export function uploadCertificatePdf(params: {
  buffer: Buffer;
  folder: string;
  publicId: string;
}): Promise<CertificateUploadResult> {
  ensureConfigured();

  return new Promise<CertificateUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: params.folder,
        public_id: params.publicId,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
        discard_original_filename: true,
        tags: ["certificate", "application/pdf"],
      },
      (error, result) => {
        if (error || !result) {
          console.error("Certificate Cloudinary upload failed:", error?.message);
          reject(new Error("Certificate upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          fileUrl: result.secure_url,
        });
      }
    );
    stream.end(params.buffer);
  });
}

/** Deletes a certificate PDF (used for compensation on DB failure). */
export async function deleteCertificatePdf(publicId: string): Promise<boolean> {
  ensureConfigured();
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error(
      "Certificate Cloudinary delete failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Admin-uploaded certificate files (PDF / JPG / JPEG / PNG)                  */
/* -------------------------------------------------------------------------- */

export interface CertificateFileUploadResult {
  publicId: string;
  fileUrl: string;
  fileSize: number;
  /** Cloudinary resource_type actually used ("raw" for PDF, "image" for raster). */
  resourceType: "raw" | "image";
}

/**
 * Cloudinary stores PDFs and raster images under different resource types, and
 * the type must be supplied again on delete. We derive it from the (already
 * whitelisted) MIME type and persist it on the certificate document so future
 * replace/delete calls never have to guess.
 */
export function resourceTypeForMime(mimeType: string): "raw" | "image" {
  return mimeType.startsWith("image/") ? "image" : "raw";
}

/** True when a stored file should render inline in the browser viewer. */
export function isImageMimeType(mimeType: string | null | undefined): boolean {
  return typeof mimeType === "string" && mimeType.startsWith("image/");
}

/**
 * Uploads an admin-supplied certificate file. The buffer has already been
 * validated (MIME + extension + magic bytes + size) by the caller.
 */
export function uploadCertificateFile(params: {
  buffer: Buffer;
  folder: string;
  publicId: string;
  mimeType: string;
}): Promise<CertificateFileUploadResult> {
  ensureConfigured();

  const resourceType = resourceTypeForMime(params.mimeType);

  return new Promise<CertificateFileUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: params.folder,
        public_id: params.publicId,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
        // Never let Cloudinary rename based on the (untrusted) original name.
        discard_original_filename: true,
        tags: ["certificate", params.mimeType],
      },
      (error, result) => {
        if (error || !result) {
          console.error("Certificate file upload failed:", error?.message);
          reject(new Error("Certificate upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          fileUrl: result.secure_url,
          fileSize:
            typeof result.bytes === "number"
              ? result.bytes
              : params.buffer.byteLength,
          resourceType,
        });
      }
    );
    stream.end(params.buffer);
  });
}

/**
 * Deletes a stored certificate file (used by replace + delete, and for
 * compensation when a DB write fails after upload).
 *
 * `resourceType` MUST match what was used at upload time; pass the value
 * persisted on the certificate (`fileResourceType`), falling back to the MIME
 * type. Returns false when deletion genuinely failed and should be retried.
 */
export async function deleteCertificateFile(
  publicId: string,
  resourceType: "raw" | "image"
): Promise<boolean> {
  ensureConfigured();
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error(
      "Certificate file delete failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/** URL that forces a download with a safe, friendly filename. */
export function buildCertificateAttachmentUrl(
  fileUrl: string,
  fileName: string
): string {
  const marker = "/upload/";
  const index = fileUrl.indexOf(marker);
  if (index === -1) return fileUrl;
  const encoded = encodeURIComponent(fileName).replace(/'/g, "%27");
  const prefix = fileUrl.slice(0, index + marker.length);
  const suffix = fileUrl.slice(index + marker.length);
  if (suffix.startsWith("fl_attachment:")) return fileUrl;
  return `${prefix}fl_attachment:${encoded}/${suffix}`;
}

/**
 * URL that renders the stored file inline in the browser (for preview).
 *
 * NOTE: mirrors the learning-resource decision — `fl_inline` is NOT injected
 * for raw assets because Cloudinary rejects raw delivery with that flag
 * (HTTP 400). The plain delivery URL is what iframe/pdf.js consumers need.
 * Images use the same plain URL.
 */
export function buildCertificateInlineUrl(fileUrl: string): string {
  return fileUrl;
}