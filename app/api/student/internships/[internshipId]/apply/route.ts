import { NextRequest, NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/auth/helpers";
import { applyForInternship } from "@/lib/internships/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    const data = await applyForInternship(
      user.id,
      (await params).internshipId,
      body,
    );
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to apply.",
      },
      { status: 400 },
    );
  }
}
