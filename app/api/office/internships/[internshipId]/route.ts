import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Internship } from "@/models/Internship";
import { objectId, serialize, slugify } from "@/lib/internships/service";
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    await connectDB();
    const { id } = { id: (await params).internshipId };
    const row = await Internship.findById(objectId(id))
      .populate("eligibleCourses", "name")
      .lean();
    return row
      ? NextResponse.json({ success: true, data: serialize(row) })
      : NextResponse.json(
          { success: false, error: "Internship not found." },
          { status: 404 },
        );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internship not found." },
      { status: 404 },
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    delete body._id;
    delete body.createdBy;
    if (body.slug) body.slug = slugify(body.slug);
    await connectDB();
    const row = await Internship.findByIdAndUpdate(
      objectId((await params).internshipId),
      { $set: { ...body, updatedBy: user.id } },
      { new: true, runValidators: true },
    ).lean();
    return row
      ? NextResponse.json({ success: true, data: serialize(row) })
      : NextResponse.json(
          { success: false, error: "Internship not found." },
          { status: 404 },
        );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Unable to update internship." },
      { status: 400 },
    );
  }
}
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  await connectDB();
  const row = await Internship.findByIdAndUpdate(
    objectId((await params).internshipId),
    { $set: { status: "archived", updatedBy: user.id } },
    { new: true },
  );
  return row
    ? NextResponse.json({ success: true })
    : NextResponse.json(
        { success: false, error: "Internship not found." },
        { status: 404 },
      );
}
