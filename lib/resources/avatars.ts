import { cloudinary, ensureConfigured } from "./client";

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_SIZE_MB = 3;

export interface AvatarUploadResult {
  publicId: string;
  fileUrl: string;
}

/** Square, optimized delivery URL for profile avatars. */
export function buildAvatarDeliveryUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: 512, height: 512, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" },
    ],
  });
}

export function uploadAvatarAsset(params: {
  buffer: Buffer;
  userId: string;
}): Promise<AvatarUploadResult> {
  ensureConfigured();

  return new Promise<AvatarUploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "education-institute/avatars",
        public_id: `student-${params.userId}`,
        overwrite: true,
        discard_original_filename: true,
        tags: ["student-avatar"],
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary avatar upload failed:", error?.message);
          reject(new Error("Cloudinary avatar upload failed"));
          return;
        }
        resolve({
          publicId: result.public_id,
          fileUrl: result.secure_url,
        });
      },
    );
    stream.end(params.buffer);
  });
}

export async function deleteAvatarAsset(publicId: string): Promise<boolean> {
  ensureConfigured();
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error(
      "Cloudinary avatar delete failed:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

export function avatarPublicIdForUser(userId: string): string {
  return `education-institute/avatars/student-${userId}`;
}
