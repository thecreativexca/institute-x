"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import type { OfficeCertificateRow } from "@/lib/office/certificates/dto";
import type { CertificateDialogMode } from "./certificate-dialogs";
import { CertificateStatusBadge } from "./certificate-status-badge";
import {
  Eye,
  Pencil,
  RefreshCw,
  Download,
  Ban,
  RotateCcw,
  Trash2,
  MoreVertical,
  Award,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CertificateTableProps {
  certificates: OfficeCertificateRow[];
  onAction: (mode: CertificateDialogMode, certificate: OfficeCertificateRow) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM yyyy");
}

const COLUMNS = [
  "Student Name",
  "Student ID",
  "Course",
  "Certificate Title",
  "Certificate Number",
  "Issue Date",
  "Status",
  "Created At",
  "Actions",
] as const;

/**
 * Admin certificate table (spec §1).
 *
 * Renders the full column set on desktop and switches to stacked cards on
 * small screens — the same responsive approach used elsewhere in the portal.
 * `Student ID` shows the LAST 8 characters of the id, which is enough to
 * distinguish students in the UI without printing the whole internals.
 */
export function CertificateTable({ certificates, onAction }: CertificateTableProps) {
  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 lg:block">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <caption className="sr-only">
            Certificates issued by the institute, with the actions available for
            each record.
          </caption>
          <thead className="bg-slate-50">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {certificates.map((certificate) => (
              <tr key={certificate.id} className="align-top hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileIcon certificate={certificate} />
                    <span className="font-medium text-slate-900">
                      {certificate.studentName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  …{certificate.studentId.slice(-8)}
                </td>
                <td className="px-4 py-3 text-slate-700">{certificate.courseName}</td>
                <td className="px-4 py-3 text-slate-700">
                  {certificate.certificateTitle ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">
                  {certificate.certificateNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                  {formatDate(certificate.issueDate)}
                </td>
                <td className="px-4 py-3">
                  <CertificateStatusBadge
                    status={certificate.status}
                    restoredAt={certificate.restoredAt}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {formatDate(certificate.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <RowActions certificate={certificate} onAction={onAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 lg:hidden">
        {certificates.map((certificate) => (
          <div
            key={certificate.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <FileIcon certificate={certificate} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {certificate.studentName}
                  </p>
                  <p className="truncate text-sm text-slate-600">
                    {certificate.certificateTitle ?? certificate.courseName}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {certificate.certificateNumber}
                  </p>
                </div>
              </div>
              <RowActions certificate={certificate} onAction={onAction} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <MobileRow label="Student ID" value={`…${certificate.studentId.slice(-8)}`} />
              <MobileRow label="Course" value={certificate.courseName} />
              <MobileRow label="Issue Date" value={formatDate(certificate.issueDate)} />
              <MobileRow label="Created At" value={formatDate(certificate.createdAt)} />
            </dl>

            <div className="mt-3">
              <CertificateStatusBadge
                status={certificate.status}
                restoredAt={certificate.restoredAt}
              />
              {certificate.revocationReason ? (
                <p className="mt-2 text-xs text-red-700">
                  Reason: {certificate.revocationReason}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="truncate text-slate-700">{value}</dd>
    </div>
  );
}

function FileIcon({ certificate }: { certificate: OfficeCertificateRow }) {
  const isImage = certificate.fileType?.startsWith("image/") ?? false;
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
      {isImage ? (
        <ImageIcon className="h-4 w-4 text-amber-800" aria-hidden="true" />
      ) : (
        <Award className="h-4 w-4 text-amber-800" aria-hidden="true" />
      )}
    </div>
  );
}

interface ActionItem {
  mode: CertificateDialogMode;
  label: string;
  icon: typeof Eye;
}

/** Only the pieces the row menu itself needs — not the whole table's props. */
interface RowActionsProps {
  certificate: OfficeCertificateRow;
  onAction: (mode: CertificateDialogMode, certificate: OfficeCertificateRow) => void;
}

/**
 * Per-row action menu: view, edit details, replace file, download, revoke,
 * reactivate, delete. Revoke is only offered for an active certificate and
 * reactivate only for a revoked one, so the UI never presents an action the
 * server would reject.
 */
function RowActions({ certificate, onAction }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const actions: ActionItem[] = [
    { mode: "view", label: "View", icon: Eye },
    { mode: "edit", label: "Edit Details", icon: Pencil },
    { mode: "replace", label: "Replace Certificate", icon: RefreshCw },
  ];

  if (certificate.status === "issued") {
    actions.push({ mode: "revoke", label: "Revoke", icon: Ban });
  } else {
    actions.push({ mode: "reactivate", label: "Reactivate", icon: RotateCcw });
  }

  const run = (mode: CertificateDialogMode) => {
    setOpen(false);
    onAction(mode, certificate);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => run("view")}
        aria-label={`View certificate ${certificate.certificateNumber}`}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
      </Button>

      {/* Download is a direct link: it streams through an authorised route. */}
      <Button asChild variant="ghost" size="sm">
        <a
          href={`/api/office/certificates/${certificate.id}/download`}
          aria-label={`Download certificate ${certificate.certificateNumber}`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </a>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-label={`More actions for ${certificate.certificateNumber}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card-hover"
        >
          {actions.map((action) => (
            <button
              key={action.mode}
              type="button"
              role="menuitem"
              onClick={() => run(action.mode)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <action.icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {action.label}
            </button>
          ))}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => run("delete")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
