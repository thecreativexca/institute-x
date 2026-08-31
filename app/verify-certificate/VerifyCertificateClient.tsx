"use client";

import { useState, useCallback, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationResultCard } from "@/components/certificates/verification-result";
import { ShieldCheck, Search } from "lucide-react";
import type { PublicVerificationResult } from "@/types/certificate";

export function VerifyCertificateClient() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!identifier.trim()) return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/certificates/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: identifier.trim() }),
        });
        const payload = (await res.json()) as {
          success: boolean;
          error?: string;
          result?: PublicVerificationResult;
        };
        if (!res.ok || !payload.success) {
          setError(payload.error ?? "Unable to verify. Please try again.");
          return;
        }
        setResult(payload.result ?? { status: "not_found" });
      } catch {
        setError("Unable to verify. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [identifier]
  );

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
            <div className="flex-1">
              <label htmlFor="verify-identifier" className="mb-1.5 block text-sm font-medium text-slate-800">
                Certificate number or verification code
              </label>
              <input
                id="verify-identifier"
                name="identifier"
                type="text"
                autoComplete="off"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="e.g. INST-2026-CN-000001 or 8F3K-91PQ-X7LM"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600/40"
              />
            </div>
            <Button type="submit" isLoading={loading} disabled={loading || !identifier.trim()} className="sm:self-end">
              {loading ? null : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {loading ? "Verifying…" : "Verify"}
            </Button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Results show only public certificate details.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {loading ? (
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10 text-slate-600">
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="text-sm">Verifying…</span>
        </div>
      ) : result ? (
        <VerificationResultCard result={result} />
      ) : null}
    </div>
  );
}