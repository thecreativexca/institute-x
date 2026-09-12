"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Award, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkWrapper } from "@/components/ui/link-button";
import type {
  OfficeCertificateListResult,
  OfficeCertificateRow,
} from "@/lib/office/certificates/dto";
import { CertificateDialogs, type CertificateDialogMode } from "./certificate-dialogs";
import {
  CertificateFilters,
  type CertificateFilterValues,
} from "./certificate-filters";
import { CertificateTable } from "./certificate-table";
import { Pagination } from "./Pagination";

interface CertificateManagerProps {
  result: OfficeCertificateListResult;
  filters: CertificateFilterValues;
  courses: Array<{ id: string; label: string }>;
  /** "active" hides revoked rows and pins the status filter. */
  variant?: "all" | "revoked";
}

/**
 * Admin Certificate Management surface.
 *
 * Owns the client-side state that the server cannot: which dialog is open and
 * the inline success/error banner. All data comes from the server component
 * above it (URL-driven filters → server query), so there is no client-side
 * copy of the list to fall out of sync. After any mutation the router refreshes
 * so the table reflects the new database state.
 */
export function CertificateManager({
  result,
  filters,
  courses,
  variant = "all",
}: CertificateManagerProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{
    mode: CertificateDialogMode;
    certificate: OfficeCertificateRow;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const basePath =
    variant === "revoked" ? "/office/certificates/revoked" : "/office/certificates";

  const handleSuccess = useCallback(
    (message: string) => {
      setDialog(null);
      setNotice(message);
      router.refresh();
    },
    [router]
  );

  const isEmpty = result.certificates.length === 0;

  return (
    <div className="space-y-5">
      {notice ? (
        <Alert
          variant="success"
          role="status"
          onClose={() => setNotice(null)}
        >
          {notice}
        </Alert>
      ) : null}

      <CertificateFilters
        initialFilters={filters}
        courses={courses}
        basePath={basePath}
        hideStatus={variant === "revoked"}
      />

      {isEmpty ? (
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="py-6">
            <EmptyState
              icon={<Award className="h-12 w-12" aria-hidden="true" />}
              title={
                variant === "revoked"
                  ? "No revoked certificates."
                  : "No certificates found."
              }
              description={
                variant === "revoked"
                  ? "Certificates you revoke will be listed here so they can be reactivated later."
                  : "Upload your first certificate to issue it to a student."
              }
              action={
                variant === "revoked" ? (
                  <Button asChild variant="outline">
                    <LinkWrapper href="/office/certificates">
                      Back to all certificates
                    </LinkWrapper>
                  </Button>
                ) : (
                  <Button asChild>
                    <LinkWrapper href="/office/certificates/upload">
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Upload Certificate
                    </LinkWrapper>
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <CertificateTable
            certificates={result.certificates}
            onAction={(mode, certificate) => {
              setNotice(null);
              setDialog({ mode, certificate });
            }}
          />

          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            totalItems={result.total}
            itemsPerPage={result.limit}
            basePath={basePath}
          />
        </>
      )}

      {dialog ? (
        <CertificateDialogs
          mode={dialog.mode}
          certificate={dialog.certificate}
          courses={courses}
          onClose={() => setDialog(null)}
          onSuccess={handleSuccess}
        />
      ) : null}
    </div>
  );
}
