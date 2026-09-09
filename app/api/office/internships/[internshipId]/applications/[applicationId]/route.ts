import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InternshipApplication } from "@/models/InternshipApplication";
import { Internship } from "@/models/Internship";
import {
  ensureInternshipEnrollment,
  objectId,
  serialize,
} from "@/lib/internships/service";
import { notifyUser } from "@/lib/notifications/service";
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ internshipId: string; applicationId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const p = await params,
      body = await request.json(),
      allowed = ["approved", "rejected", "waitlisted"];
    if (body.status && !allowed.includes(body.status))
      return NextResponse.json(
        { success: false, error: "Invalid status." },
        { status: 400 },
      );
    await connectDB();
    const app = await InternshipApplication.findOneAndUpdate(
      { _id: objectId(p.applicationId), internship: objectId(p.internshipId) },
      {
        $set: {
          status: body.status,
          adminNote: body.adminNote,
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      },
      { new: true },
    );
    if (!app)
      return NextResponse.json(
        { success: false, error: "Application not found." },
        { status: 404 },
      );
    if (body.status === "approved")
      await ensureInternshipEnrollment(app.internship, app.student, app._id);
    const internship = await Internship.findById(app.internship)
      .select("title")
      .lean();
    await notifyUser({
      recipientId: app.student,
      title: `Internship application ${body.status}`,
      message: `Your application for ${internship?.title ?? "the internship"} was ${body.status}.`,
      type:
        body.status === "approved"
          ? "success"
          : body.status === "rejected"
            ? "error"
            : "info",
      link: `/student/internships/${app.internship}`,
    });
    return NextResponse.json({
      success: true,
      data: serialize(app.toObject()),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to review application.",
      },
      { status: 400 },
    );
  }
}

export const POST = PATCH;
