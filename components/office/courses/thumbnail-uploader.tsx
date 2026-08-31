"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * Course thumbnail uploader (req. 23–25). Uploads through the server API so
 * the Cloudinary secret never reaches the browser; shows a professional
 * placeholder when no image exists.
 */
export function ThumbnailUploader({
  courseId,
  initialUrl,
  canEdit,
}: {
  courseId: string;
  initialUrl: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setError("");
    setSuccess("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(`/api/office/courses/${courseId}/thumbnail`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? "The image could not be uploaded.");
      } else {
        setUrl(payload.thumbnailUrl);
        setSuccess("Thumbnail updated.");
        router.refresh();
      }
    } catch {
      setError("The image could not be uploaded. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Course thumbnail" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16l4-5 4 4 3-3 5 6" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="4" width="18" height="16" rx="2" />
            </svg>
            <span className="text-xs">No thumbnail yet</span>
          </div>
        )}
      </div>

      {canEdit ? (
        <div>
          <label htmlFor="thumbnail-input" className="sr-only">
            Upload course thumbnail
          </label>
          <input
            id="thumbnail-input"
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            disabled={isUploading}
            className="block w-full max-w-sm cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800 hover:file:bg-primary-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            JPG, JPEG, PNG or WebP · max 5 MB
            {isUploading ? " · Uploading…" : ""}
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </p>
      ) : null}
    </div>
  );
}
