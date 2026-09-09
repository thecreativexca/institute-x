import { NextRequest, NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/auth/helpers";
import { joinInternship } from "@/lib/internships/service";
export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse!;
  try {
    await joinInternship(user.id, (await params).internshipId);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to join.",
      },
      { status: 400 },
    );
  }
}