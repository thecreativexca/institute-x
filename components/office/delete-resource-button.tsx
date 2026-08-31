"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/**
 * Staff-side delete control. Calls the server DELETE route (role is
 * re-verified server-side). The Cloudinary asset is removed first; the
 * database record is only removed when storage deletion succeeds.
 */
export function DeleteResourceButton({ resourceId, title }: { resourceId: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (isDeleting) return;
    const confirmed = window.confirm(
      `Delete "${title}"? The file is removed from storage and cannot be recovered.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/office/resources/${resourceId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? "Unable to delete the resource. Please try again.");
        setIsDeleting(false);
        return;
      }

      startTransition(() => router.refresh());
      setIsDeleting(false);
    } catch {
      setError("Unable to delete the resource. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting || isPending}
        aria-label={`Delete resource ${title}`}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        {isDeleting || isPending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
