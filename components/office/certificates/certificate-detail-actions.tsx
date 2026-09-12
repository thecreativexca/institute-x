"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { OfficeCertificateRow } from "@/lib/office/certificates/dto";
import { CertificateDialogs, type CertificateDialogMode } from "./certificate-dialogs";
import { Download, Eye, Pencil, RefreshCw, Ban, RotateCcw, Trash2 } from "lucide-react";

interface Props {
  certificate: OfficeCertificateRow;
  courses: Array<{ id: string; label: string }>;
}

/**
 * Action bar for a single certificate's admin detail page.
 *
 * Uses the same dialogs as the list view, so there is exactly one
 * implementation of revoke / reactivate / replace / delete across the portal.
 */
export function CertificateDetailActions({ certificate, courses }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<CertificateDialogMode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSuccess = useCallback(
    (message: string) => {
      setDialog(null);
      setNotice(message);
      router.refresh();
    },
    [router]
  );

  const isRevoked = certificate.status === "revoked";

  return (
    <div className="space-y-4">
      {notice ? (
        <Alert variant="success" role="status" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setDialog("view")}>
          <Eye className="h-4 w-4" aria-hidden="true" /> View
        </Button>

        <Button asChild variant="secondary">
          <a href={`/api/office/certificates/${certificate.id}/download`}>
            <Download className="h-4 w-4" aria-hidden="true" /> Download
          </a>
        </Button>

        <Button variant="outline" onClick={() => setDialog("edit")}>
          <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Details
        </Button>

        <Button variant="outline" onClick={() => setDialog("replace")}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Replace Certificate
        </Button>

        {isRevoked ? (
          <Button variant="primary" onClick={() => setDialog("reactivate")}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reactivate
          </Button>
        ) : (
          <Button variant="danger" onClick={() => setDialog("revoke")}>
            <Ban className="h-4 w-4" aria-hidden="true" /> Revoke
          </Button>
        )}

        <Button variant="ghost" onClick={() => setDialog("delete")}>
          <Trash2 className="h-4 w-4 text-red-700" aria-hidden="true" />
          <span className="text-red-700">Delete</span>
        </Button>
      </div>

      {dialog ? (
        <CertificateDialogs
          mode={dialog}
          certificate={certificate}
          courses={courses}
          onClose={() => setDialog(null)}
          onSuccess={handleSuccess}
        />
      ) : null}
    </div>
  );
}
