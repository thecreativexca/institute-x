import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InternshipTaskSubmission } from "@/models/InternshipTaskSubmission";
import { notifyUser } from "@/lib/notifications/service";
import {
  objectId,
  serialize,
  calculateInternshipProgress,
} from "@/lib/internships/service";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    if (!["reviewed", "changes_required", "completed"].includes(body.status))
      return NextResponse.json(
        { success: false, error: "Invalid review status." },
        { status: 400 },
      );
    await connectDB();
    const row = await InternshipTaskSubmission.findByIdAndUpdate(
      objectId((await params).submissionId),
      {
        $set: {
          status: body.status,
          marks: body.marks ?? null,
          feedback: body.feedback ?? null,
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      },
      { new: true, runValidators: true },
    );
    if (!row)
      return NextResponse.json(
        { success: false, error: "Submission not found." },
        { status: 404 },
      );
    await notifyUser({
      recipientId: row.student,
      title:
        body.status === "changes_required"
          ? "Task changes requested"
          : "Task reviewed",
      message: body.feedback || "Your internship task was reviewed.",
      type: body.status === "changes_required" ? "warning" : "success",
      link: `/student/internships/${row.internship}`,
    });
    await calculateInternshipProgress(
      row.internship.toString(),
      row.student.toString(),
    );
    return NextResponse.json({
      success: true,
      data: serialize(row.toObject()),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to review.",
      },
      { status: 400 },
    );
  }
}
