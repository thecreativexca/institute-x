"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Award } from "lucide-react";

interface GenerateCertificateButtonProps {
  enrollmentId: string;
}

/**
 * Student "Generate Certificate" action (spec §13, §77).
 * Calls the secure issue endpoint with only a server-resolved enrollment id —
 * the client never supplies identity, course or completion data.
 */
export function GenerateCertificateButton({
  enrollmentId,
}: GenerateCertificateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/student/certificates/${encodeURIComponent(enrollmentId)}/issue`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const payload = (await res.json()) as {
        success: boolean;
        error?: string;
        certificate?: { id: string };
      };
      if (!res.ok || !payload.success) {
        setError(payload.error ?? "Unable to generate the certificate.");
        return;
      }
      router.push(`/student/certificates/${payload.certificate?.id ?? ""}`);
      router.refresh();
    } catch {
      setError("Unable to generate the certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [enrollmentId, router]);

  return (
    <div className="space-y-3">
      <Button onClick={onGenerate} isLoading={loading} disabled={loading}>
        <Award className="h-4 w-4" aria-hidden="true" />
        {loading ? "Generating…" : "Generate Certificate"}
      </Button>
      {error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : null}
    </div>
  );
}