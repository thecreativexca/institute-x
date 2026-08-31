import { NextRequest, NextResponse } from "next/server";

import { requireStudentCertificateOrResponse, certificateDownloadFileName } from "@/lib/certificates/download";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/student/certificates/[certificateId]/download
 *
 * Private, ownership-checked download (spec §25, §47–§48). The PDF streams
 * through the server with `Content-Disposition: attachment` and a sanitized,
 * professional filename. Swapping the certificateId cannot expose another
 * student's PDF because the guard filters by the session student.
 */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const guard = await requireStudentCertificateOrResponse(ctx);
  if ("response" in guard) return guard.response;

  const { detail } = guard;

  try {
    const upstream = await fetch(detail.pdfUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      console.error("Certificate download upstream failed:", upstream.status);
      return NextResponse.json(
        { success: false, error: "Unable to open this certificate." },
        { status: 502 }
      );
    }

    const fileName = certificateDownloadFileName(detail);

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(upstream.headers.get("content-length") ?? ""),
        "Content-Disposition": `attachment; filename="${fileName.ascii}"; filename*=UTF-8''${fileName.encoded}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Certificate download failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { success: false, error: "Unable to open this certificate." },
      { status: 500 }
    );
  }
}