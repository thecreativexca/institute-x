import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStudentApi } from "@/lib/auth/helpers";
import { PROGRESS_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { completeEnrollmentIfEligible } from "@/lib/progress/course";
import { getStudentLessonContext } from "@/lib/resources/queries";
import { ResourceError } from "@/lib/resources/errors";
import { toObjectId } from "@/lib/utils/object-id";
import { Progress } from "@/models/Progress";

const schema = z.object({
  completed: z.boolean().default(false),
  watchedSeconds: z.number().min(0).max(86_400).optional(),
  totalSeconds: z.number().min(0).max(86_400).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse;
  try {
    const { lessonId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid progress update." }, { status: 400 });
    const context = await getStudentLessonContext({ studentId: user.id, lessonId });
    await connectDB();
    const now = new Date();
    const progress = await Progress.findOneAndUpdate(
      { student: toObjectId(user.id), course: toObjectId(context.courseId), lesson: toObjectId(lessonId) },
      {
        $set: {
          status: parsed.data.completed ? PROGRESS_STATUSES.COMPLETED : PROGRESS_STATUSES.IN_PROGRESS,
          lastViewedAt: now,
          completedAt: parsed.data.completed ? now : null,
          ...(parsed.data.watchedSeconds !== undefined ? { watchedSeconds: parsed.data.watchedSeconds } : {}),
          ...(parsed.data.totalSeconds !== undefined ? { totalSeconds: parsed.data.totalSeconds } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const completion = parsed.data.completed
      ? await completeEnrollmentIfEligible(user.id, context.courseId)
      : null;
    return NextResponse.json({
      success: true,
      progress: { completed: progress.status === PROGRESS_STATUSES.COMPLETED, completedAt: progress.completedAt?.toISOString() ?? null },
      courseCompleted: completion?.completed ?? false,
    });
  } catch (error) {
    if (error instanceof ResourceError) return NextResponse.json({ success: false, error: "Lesson not found." }, { status: 404 });
    console.error("Lesson progress update failed:", error);
    return NextResponse.json({ success: false, error: "Unable to save lesson progress." }, { status: 500 });
  }
}
