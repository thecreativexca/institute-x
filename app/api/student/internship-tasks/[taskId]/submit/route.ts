import { NextRequest, NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InternshipTask } from "@/models/InternshipTask";
import { InternshipTaskSubmission } from "@/models/InternshipTaskSubmission";
import {
  requireInternshipParticipant,
  objectId,
  serialize,
  calculateInternshipProgress,
} from "@/lib/internships/service";
import { notifyAdmins } from "@/lib/notifications/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    if (
      !body.text &&
      !body.githubUrl &&
      !body.liveUrl &&
      !body.externalUrl &&
      !body.files?.length
    )
      return NextResponse.json(
        { success: false, error: "Add at least one submission field." },
        { status: 400 },
      );
    await connectDB();
    const task = await InternshipTask.findOne({
      _id: objectId((await params).taskId),
      status: "published",
    });
    if (!task)
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 },
      );
    if (
      task.dueDate &&
      task.dueDate.getTime() < Date.now()
    )
      return NextResponse.json(
        { success: false, error: "The task deadline has passed." },
        { status: 400 },
      );
    if (
      !(await requireInternshipParticipant(task.internship.toString(), user.id))
    )
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    const previous = await InternshipTaskSubmission.findOne({
      task: task._id,
      student: objectId(user.id),
    });
    const history = previous
      ? [
          ...(previous.history ?? []),
          {
            text: previous.text,
            files: previous.files,
            githubUrl: previous.githubUrl,
            liveUrl: previous.liveUrl,
            externalUrl: previous.externalUrl,
            submittedAt: previous.submittedAt,
          },
        ]
      : [];
    const row = await InternshipTaskSubmission.findOneAndUpdate(
      { task: task._id, student: objectId(user.id) },
      {
        $set: {
          ...body,
          internship: task.internship,
          status: "submitted",
          submittedAt: new Date(),
          history,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    await notifyAdmins({
      title: "Internship task submitted",
      message: `${task.title} has a new submission.`,
      link: `/office/internships/${task.internship}?tab=tasks`,
    });
    await calculateInternshipProgress(task.internship.toString(), user.id);
    return NextResponse.json({
      success: true,
      data: serialize(row.toObject()),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to submit task.",
      },
      { status: 400 },
    );
  }
}
