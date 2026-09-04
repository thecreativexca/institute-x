import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStudentApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { getStudentResourceIfAllowed } from "@/lib/resources/access";
import { ResourceError } from "@/lib/resources/errors";
import { toObjectId } from "@/lib/utils/object-id";
import { ReadingProgress } from "@/models/ReadingProgress";

const updateSchema = z.object({
  lastPage: z.number().int().min(1),
  totalPages: z.number().int().min(1).max(20_000),
  bookmarks: z.array(z.number().int().min(1).max(20_000)).max(200),
});

type Context = { params: Promise<{ resourceId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse;
  try {
    const { resourceId } = await params;
    await getStudentResourceIfAllowed({ studentId: user.id, resourceId });
    await connectDB();
    const progress = await ReadingProgress.findOne({
      student: toObjectId(user.id),
      resource: toObjectId(resourceId),
    })
      .select("lastPage totalPages progressPercentage bookmarks lastReadAt")
      .lean();
    return NextResponse.json({
      success: true,
      progress: progress
        ? {
            lastPage: progress.lastPage,
            totalPages: progress.totalPages,
            progressPercentage: progress.progressPercentage,
            bookmarks: progress.bookmarks,
            lastReadAt: progress.lastReadAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    return progressError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse;
  try {
    const { resourceId } = await params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid reading progress." }, { status: 400 });
    }
    const context = await getStudentResourceIfAllowed({ studentId: user.id, resourceId });
    const lastPage = Math.min(parsed.data.lastPage, parsed.data.totalPages);
    const bookmarks = [...new Set(parsed.data.bookmarks)]
      .filter((page) => page <= parsed.data.totalPages)
      .sort((a, b) => a - b);
    await connectDB();
    const progress = await ReadingProgress.findOneAndUpdate(
      { student: toObjectId(user.id), resource: toObjectId(resourceId) },
      {
        $set: {
          course: context.resource.course,
          lastPage,
          totalPages: parsed.data.totalPages,
          progressPercentage: Math.round((lastPage / parsed.data.totalPages) * 100),
          bookmarks,
          lastReadAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({
      success: true,
      progress: {
        lastPage: progress.lastPage,
        totalPages: progress.totalPages,
        progressPercentage: progress.progressPercentage,
        bookmarks: progress.bookmarks,
        lastReadAt: progress.lastReadAt.toISOString(),
      },
    });
  } catch (error) {
    return progressError(error);
  }
}

function progressError(error: unknown) {
  if (error instanceof ResourceError) {
    return NextResponse.json({ success: false, error: "Resource not found." }, { status: 404 });
  }
  console.error("Reading progress request failed:", error);
  return NextResponse.json({ success: false, error: "Unable to save reading progress." }, { status: 500 });
}
