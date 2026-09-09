import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InternshipMilestone } from "@/models/InternshipMilestone";
import { objectId, serialize } from "@/lib/internships/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    if (!body.title)
      return NextResponse.json(
        { success: false, error: "Title is required." },
        { status: 400 },
      );
    await connectDB();
    const row = await InternshipMilestone.create({
      ...body,
      internship: objectId((await params).internshipId),
    });
    return NextResponse.json(
      { success: true, data: serialize(row.toObject()) },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to create milestone.",
      },
      { status: 400 },
    );
  }
}
