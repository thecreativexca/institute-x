import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/config/env";

/**
 * Server-only Cloudinary utility for learning resources (PDFs/documents).
 *
 * - Configured exclusively from server environment variables.
 * - Never import this module from a client component ("server-only" guard
 *   makes that a build-time error).
 * - Documents are uploaded with resource_type "raw" (NOT images) so Cloudinary
 *   treats them as files, and organized under a predictable course tree.
 */

/** Logical Cloudinary folder root for all learning resources. */
const RESOURCE_ROOT = "education-institute/courses";

export interface CloudinaryUploadResult {
  publicId: string;
  /** Signed-off secure delivery URL of the stored asset. */
  fileUrl: string;
  fileSize: number;
  resourceType: string;
}

/** Builds the deterministic Cloudinary folder for a lesson's resources. */
export function buildResourceFolder(params: {
  courseSlug: string;
  moduleId: string;
  lessonId: string;
}): string {
  return [
    RESOURCE_ROOT,
    params.courseSlug,
    "modules",
    params.moduleId,
    "lessons",
    params.lessonId,
    "resources",
  ].join("/");
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

/**
 * Uploads a document buffer to Cloudinary as a raw resource.
 * `publicId` must already be fully sanitized (see lib/resources/validation.ts).
 */
export function uploadResourceAsset(params: {
  buffer: Buffer;
  folder: string;
  publicId: string;
  mimeType: string;
}): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: params.folder,
        public_id: params.publicId,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
        // Never let Cloudinary rename based on the (untrusted) original name.
        discard_original_filename: true,
        tags: ["learning-resource", params.mimeType],
      },
      (error, result) => {
        if (error || !result) {
          // Log server-side only; the client receives a generic message.
          console.error("Cloudinary upload failed:", error?.message);
          reject(new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          fileUrl: result.secure_url,
          fileSize:
            typeof result.bytes === "number"
              ? result.bytes
              : params.buffer.byteLength,
          resourceType: result.resource_type ?? "raw",
        });
      }
    );
    stream.end(params.buffer);
  });
}

/**
 * Deletes a Cloudinary asset. Returns true when the asset is gone
 * ("ok" or "not found"), false when deletion failed and should be retried.
 */
export async function deleteResourceAsset(publicId: string): Promise<boolean> {
  ensureConfigured();

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error(
      "Cloudinary delete failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Injects a Cloudinary delivery flag (e.g. fl_inline / fl_attachment) into a
 * raw delivery URL. Flags must sit immediately after the `/upload/` segment:
 *   .../raw/upload/fl_inline/v1712345/education-institute/.../file.pdf
 */
export function withDeliveryFlag(
  fileUrl: string,
  flag: string
): string | null {
  const marker = "/upload/";
  const index = fileUrl.indexOf(marker);
  if (index === -1) return null;
  const prefix = fileUrl.slice(0, index + marker.length);
  const suffix = fileUrl.slice(index + marker.length);
  // Avoid double-inserting the same flag.
  if (suffix.startsWith(`${flag}/`)) return fileUrl;
  return `${prefix}${flag}/${suffix}`;
}

/** URL that renders a PDF inline in the browser (when supported). */
export function buildInlineUrl(fileUrl: string): string {
  return withDeliveryFlag(fileUrl, "fl_inline") ?? fileUrl;
}

/** URL that forces a download with a friendly filename. */
export function buildAttachmentUrl(fileUrl: string, fileName: string): string {
  const encoded = encodeURIComponent(fileName).replace(/'/g, "%27");
  return withDeliveryFlag(fileUrl, `fl_attachment:${encoded}`) ?? fileUrl;
}
