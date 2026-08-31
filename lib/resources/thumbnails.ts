import { cloudinary, ensureConfigured } from "./client";

/**
 * Server-only Cloudinary utility for COURSE THUMBNAILS (Phase 17, req. 23).
 * Images are validated (JPG/JPEG/PNG/WebP) server-side and delivered through
 * Cloudinary's optimized transformations.
 */

export const ALLOWED_THUMBNAIL_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_THUMBNAIL_SIZE_MB = 5;

export interface ThumbnailUploadResult {
  publicId: string;
  fileUrl: string;
  width: number;
  height: number;
}

/** Optimized 16:9-ish delivery URL for course cards/details. */
export function buildThumbnailDeliveryUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: 1200, height: 675, crop: "fill", quality: "auto", fetch_format: "auto" },
    ],
  });
}

export function uploadThumbnailAsset(params: {
  buffer: Buffer;
  courseId: string;
}): Promise<ThumbnailUploadResult> {
  ensureConfigured();

  return new Promise<ThumbnailUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "education-institute/course-thumbnails",
        public_id: `course-${params.courseId}-${Date.now()}`,
        overwrite: false,
        discard_original_filename: true,
        tags: ["course-thumbnail"],
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary thumbnail upload failed:", error?.message);
          reject(new Error("Cloudinary thumbnail upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          fileUrl: result.secure_url,
          width: result.width ?? 0,
          height: result.height ?? 0,
        });
      }
    );
    stream.end(params.buffer);
  });
}

/**
 * Deletes a course thumbnail image. Returns true when the asset is gone
 * ("ok" or "not found"); false means the deletion should be retried/logged.
 */
export async function deleteThumbnailAsset(publicId: string): Promise<boolean> {
  ensureConfigured();
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error(
      "Cloudinary thumbnail delete failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}