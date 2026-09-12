import "server-only";

import { NextResponse } from "next/server";

/**
 * Secure certificate file delivery.
 *
 * The Cloudinary delivery URL is treated as a server-side implementation
 * detail: it is NEVER sent to the browser. Instead an authorised route handler
 * (admin, or the owning student) fetches the asset server-side and streams it
 * back with an explicit `Content-Disposition`. A student therefore cannot
 * obtain a shareable direct link to a file they are not allowed to read, and a
 * revoked certificate's download can simply be refused at the route.
 */

/** Strips anything that could break a header value or smuggle a path. */
function sanitizeDownloadName(fileName: string): string {
  const cleaned = fileName
    .replace(/[\r\n"\\/]/g, "")
    .replace(/[^\w.\- ]/g, "_")
    .trim();
  return cleaned.slice(0, 120) || "certificate";
}

export interface StreamCertificateFileParams {
  /** Stored Cloudinary delivery URL. */
  fileUrl: string;
  /** MIME type stored on the certificate; used for Content-Type. */
  mimeType: string | null | undefined;
  /** Friendly base name (no extension) — usually the certificate number. */
  fileName: string;
  /** Extension without the dot, derived from the MIME type. */
  extension: string;
  /** `inline` for the viewer, `attachment` to force a download. */
  disposition: "inline" | "attachment";
}

/**
 * Streams the stored certificate file to the client.
 *
 * Returns a 502 rather than a 500 when storage cannot be reached, so the caller
 * can distinguish "our storage is down" from a bug.
 */
export async function streamCertificateFile(
  params: StreamCertificateFileParams
): Promise<NextResponse> {
  let upstream: Response;
  try {
    upstream = await fetch(params.fileUrl, { cache: "no-store" });
  } catch (error) {
    console.error(
      "Certificate file fetch failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { success: false, error: "The certificate file is temporarily unavailable." },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    // A deleted or renamed asset lands here; the DB row is simply stale.
    console.error(
      "Certificate file unavailable:",
      upstream.status,
      upstream.statusText
    );
    return NextResponse.json(
      { success: false, error: "The certificate file could not be found." },
      { status: 404 }
    );
  }

  const contentType = params.mimeType || "application/octet-stream";
  const downloadName = `${sanitizeDownloadName(params.fileName)}.${params.extension}`;

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${params.disposition}; filename="${downloadName}"`,
      // Never cache a private document in a shared/proxy cache.
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Extension for a stored MIME type, defaulting to pdf for legacy rows. */
export function extensionForMimeType(mimeType: string | null | undefined): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "application/pdf":
    default:
      return "pdf";
  }
}
