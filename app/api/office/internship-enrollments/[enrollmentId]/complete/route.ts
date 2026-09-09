import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InternshipEnrollment } from "@/models/InternshipEnrollment";
import { Internship } from "@/models/Internship";
import {
  calculateInternshipProgress,
  completionBlockedReason,
  objectId,
  serialize,
} from "@/lib/internships/service";
import { notifyUser } from "@/lib/notifications/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json().catch(() => ({}));
    const override = Boolean(body?.override);
    await connectDB();
    const row = await InternshipEnrollment.findById(
      objectId((await params).enrollmentId),
    );
    if (!row)
      return NextResponse.json(
        { success: false, error: "Enrollment not found." },
        { status: 404 },
      );
    const internship = await Internship.findById(row.internship);
    if (!internship) throw new Error("Internship not found.");
    const p = await calculateInternshipProgress(
        row.internship.toString(),
        row.student.toString(),
      ),
      blocked = completionBlockedReason(
        internship.completionRules,
        p,
        row.finalScore,
      );
    if (!override && blocked)
      return NextResponse.json(
        { success: false, error: blocked },
        { status: 409 },
      );
    row.status = "completed";
    row.completedAt = new Date();
    row.endDate = row.endDate ?? new Date();
    await row.save();
    await notifyUser({
      recipientId: row.student,
      title: "Internship completed",
      message: `You completed ${internship.title}.`,
      type: "success",
      link: `/student/internships/${row.internship}`,
    });
    return NextResponse.json({
      success: true,
      data: serialize(row.toObject()),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error:
          e instanceof Error ? e.message : "Unable to complete internship.",
      },
      { status: 400 },
    );
  }
}
