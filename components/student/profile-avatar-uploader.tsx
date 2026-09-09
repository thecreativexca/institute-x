"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProfileAvatarUploaderProps {
  name: string;
  initialUrl?: string | null;
  compact?: boolean;
}

export function ProfileAvatarUploader({
  name,
  initialUrl,
  compact = false,
}: ProfileAvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
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
      const response = await fetch("/api/student/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? "The image could not be uploaded.");
        return;
      }
      setUrl(payload.avatarUrl);
      setSuccess("Profile photo updated.");
      router.refresh();
    } catch {
      setError("The image could not be uploaded. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setError("");
    setSuccess("");
    setIsRemoving(true);
    try {
      const response = await fetch("/api/student/profile/avatar", {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? "Unable to remove profile photo.");
        return;
      }
      setUrl("");
      setSuccess("Profile photo removed.");
      router.refresh();
    } catch {
      setError("Unable to remove profile photo.");
    } finally {
      setIsRemoving(false);
    }
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar
          className={
            compact
              ? "h-20 w-20 border-2 border-white shadow-md ring-1 ring-primary-100"
              : "h-24 w-24 border-4 border-white shadow-lg ring-1 ring-primary-100"
          }
        >
          <AvatarImage src={url || undefined} alt={name} />
          <AvatarFallback className="bg-primary-100 text-lg font-semibold text-primary-800">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading || isRemoving}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              {isUploading ? "Uploading…" : url ? "Change photo" : "Upload photo"}
            </Button>
            {url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading || isRemoving}
                onClick={() => void removePhoto()}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {isRemoving ? "Removing…" : "Remove"}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            JPG, JPEG, PNG or WebP · max 3 MB
          </p>
        </div>
      </div>

      <label htmlFor="profile-avatar-input" className="sr-only">
        Upload profile photo
      </label>
      <input
        id="profile-avatar-input"
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        disabled={isUploading || isRemoving}
      />

      {!url && !compact ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary-200 bg-primary-50/50 px-4 py-3 text-sm text-slate-600">
          <User className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          Add a profile photo so your account is easier to recognize.
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}
    </div>
  );
}
