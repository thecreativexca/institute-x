import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Internship } from "@/models/Internship";
import { User } from "@/models/User";
import {
  ensureInternshipEnrollment,
  objectId,
  serialize,
} from "@/lib/internships/service";
import { notifyUser } from "@/lib/notifications/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ internshipId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const { studentId } = await request.json(),
      iid = objectId((await params).internshipId),
      sid = objectId(studentId);
    await connectDB();
    const [internship, student] = await Promise.all([
      Internship.findById(iid),
      User.findOne({ _id: sid, role: "student", status: "active" }),
    ]);
    if (!internship || !student)
      return NextResponse.json(
        { success: false, error: "Internship or active student not found." },
        { status: 404 },
      );
    const enrollment = await ensureInternshipEnrollment(iid, sid);
    await notifyUser({
      recipientId: sid,
      title: "Internship assigned",
      message: `You have been assigned to ${internship.title}.`,
      type: "success",
      link: `/student/internships/${iid}`,
    });
    return NextResponse.json(
      { success: true, data: serialize(enrollment.toObject()) },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to assign student.",
      },
      { status: 400 },
    );
  }
}
