import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InternshipTask } from "@/models/InternshipTask";
import { InternshipEnrollment } from "@/models/InternshipEnrollment";
import { notifyUser } from "@/lib/notifications/service";
import { objectId, parseDateInput, serialize } from "@/lib/internships/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json(),
      iid = objectId((await params).internshipId);
    if (!body.title || !body.description)
      return NextResponse.json(
        { success: false, error: "Title and description are required." },
        { status: 400 },
      );
    await connectDB();
    const row = await InternshipTask.create({
      title: body.title,
      description: body.description,
      internship: iid,
      dueDate: parseDateInput(body.dueDate),
      points: body.points ? Number(body.points) : null,
      status: body.status || "draft",
      required: body.required !== false,
    });
    if (row.status === "published") {
      const students = await InternshipEnrollment.find({
        internship: iid,
        status: { $in: ["selected", "active"] },
      }).distinct("student");
      await Promise.all(
        students.map((id) =>
          notifyUser({
            recipientId: id,
            title: "New internship task",
            message: row.title,
            link: `/student/internships/${iid}`,
          }),
        ),
      );
    }
    return NextResponse.json(
      { success: true, data: serialize(row.toObject()) },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to create task.",
      },
      { status: 400 },
    );
  }
}
