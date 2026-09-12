import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ban, RotateCcw } from "lucide-react";
import type { OfficeCertificateRow } from "@/lib/office/certificates/dto";

/**
 * Certificate status badge — text + icon, never color alone.
 *
 * The database value for a live certificate is `issued`; the office UI labels
 * it "Active", which is the word the spec uses. A restored certificate is shown
 * as "Reactivated" so an admin can tell it apart from one that was never
 * revoked.
 */
export function CertificateStatusBadge({
  status,
  restoredAt,
}: {
  status: OfficeCertificateRow["status"];
  restoredAt?: string | null;
}) {
  if (status === "revoked") {
    return (
      <Badge variant="danger">
        <Ban className="mr-1 h-3 w-3" aria-hidden="true" /> Revoked
      </Badge>
    );
  }

  if (restoredAt) {
    return (
      <Badge variant="warning">
        <RotateCcw className="mr-1 h-3 w-3" aria-hidden="true" /> Reactivated
      </Badge>
    );
  }

  return (
    <Badge variant="success">
      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" /> Active
    </Badge>
  );
}
