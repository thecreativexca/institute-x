import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/models/Project";
import { objectId, serialize, slugify } from "@/lib/internships/service";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    delete body._id;
    if (body.slug) body.slug = slugify(body.slug);
    await connectDB();
    const row = await Project.findByIdAndUpdate(
      objectId((await params).projectId),
      { $set: { ...body, updatedBy: user.id } },
      { new: true, runValidators: true },
    );
    return row
      ? NextResponse.json({ success: true, data: serialize(row.toObject()) })
      : NextResponse.json(
          { success: false, error: "Project not found." },
          { status: 404 },
        );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to update project.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  await connectDB();
  await Project.findByIdAndUpdate(objectId((await params).projectId), {
    $set: { status: "archived", updatedBy: user.id },
  });
  return NextResponse.json({ success: true });
}
