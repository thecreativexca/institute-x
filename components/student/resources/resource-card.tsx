import Link from "next/link";
import { FileText, Download, Eye } from "lucide-react";

import type { StudentResourceView } from "@/lib/resources/queries";
import { RESOURCE_ACCESS, RESOURCE_TYPES } from "@/lib/constants";
import { formatFileSize } from "@/lib/utils/format-file-size";

/** Text label for the resource type — never icon-only (a11y requirement). */
function typeLabel(resource: Pick<StudentResourceView, "type" | "mimeType">): string {
  if (resource.type === RESOURCE_TYPES.PDF) return "PDF";
  const mime = resource.mimeType.toLowerCase();
  if (mime === "application/msword") return "DOC";
  if (
    mime ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOCX";
  }
  if (mime === "text/plain") return "TXT";
  return "File";
}

/** MIME types browsers can render natively in the viewer page. */
function isViewableInBrowser(resource: Pick<StudentResourceView, "type" | "mimeType">): boolean {
  return (
    resource.type === RESOURCE_TYPES.PDF ||
    resource.mimeType.toLowerCase() === "text/plain"
  );
}

export function ResourceCard({ resource }: { resource: StudentResourceView }) {
  const canView = isViewableInBrowser(resource);
  // Only VIEW_AND_DOWNLOAD exposes the download action in the UI. VIEW_ONLY
  // intentionally hides it (note: browsers cannot guarantee this technically —
  // the app only controls the intended access flow).
  const canDownload = resource.access === RESOURCE_ACCESS.VIEW_AND_DOWNLOAD;
  const viewHref = `/student/resources/${resource._id.toString()}`;
  const downloadHref = `/api/student/resources/${resource._id.toString()}/download`;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-gradient-to-r from-white to-primary-50/30 p-4 transition-all hover:border-primary-200 hover:shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100"
          aria-hidden="true"
        >
          <FileText className="h-5 w-5 text-primary-600" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {resource.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            <span>{typeLabel(resource)}</span>
            <span aria-hidden="true"> · </span>
            <span>{formatFileSize(resource.fileSize)}</span>
            {resource.description ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className="line-clamp-1">{resource.description}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {canView ? (
          <Link
            href={viewHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            View {resource.type === RESOURCE_TYPES.PDF ? "PDF" : "File"}
          </Link>
        ) : null}
        {canDownload ? (
          <a
            href={downloadHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-medium text-white hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </a>
        ) : (
          <span className="text-xs text-slate-400">
            {canView ? "View only" : "Not downloadable"}
          </span>
        )}
      </div>
    </article>
  );
}
