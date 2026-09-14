"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ResourceScopeButtonProps {
  resourceId: string;
  scope: "lesson" | "module" | "course";
  isPublished: boolean;
  access: string;
}

export function ResourceScopeButton({ resourceId, scope, isPublished, access }: ResourceScopeButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function changeScope() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/office/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "course",
          ...(!isPublished ? { isPublished: true } : {}),
          ...(access === "private" ? { access: "view_and_download" } : {}),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Unable to update the resource.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update the resource.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="text-right">
      {scope === "course" ? (
        <span className="text-xs font-medium text-primary-700">Shown in all lessons</span>
      ) : (
        <>
          <Button type="button" size="sm" variant="outline" isLoading={pending} onClick={changeScope}>
            Show in all modules &amp; lessons
          </Button>
          {!isPublished || access === "private" ? (
            <p className="mt-1 max-w-56 text-xs text-slate-500">This also publishes the file for enrolled students.</p>
          ) : null}
        </>
      )}
      {error ? <p role="alert" className="mt-1 max-w-56 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
