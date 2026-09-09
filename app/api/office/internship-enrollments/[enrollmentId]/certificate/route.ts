import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { issueInternshipCertificate } from "@/lib/certificates/issue-internship";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const { override = false } = await request.json();
    const data = await issueInternshipCertificate(
      (await params).enrollmentId,
      user.id,
      override,
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to issue certificate.",
      },
      { status: 400 },
    );
  }
}
