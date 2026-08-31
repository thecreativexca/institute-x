import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db/connect";
import { requireResourceManagerOrResponse, toResourceErrorResponse } from "@/lib/resources/http";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import { toObjectId } from "@/lib/utils/object-id";

export const runtime = "nodejs";

/**
 * GET /api/office/resources/catalog — cascading picker data for the upload
 * foundation (?type=courses | modules&courseId | lessons&moduleId).
 * Returns minimal, safe fields only.
 */
const querySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("courses") }),
  z.object({ type: z.literal("modules"), courseId: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
  z.object({ type: z.literal("lessons"), moduleId: z.string().regex(/^[0-9a-fA-F]{24}$/) }),
]);

export async function GET(request: NextRequest) {
  const auth = await requireResourceManagerOrResponse();
  if ("response" in auth) return auth.response;

  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse({
    type: searchParams.get("type"),
    courseId: searchParams.get("courseId") ?? undefined,
    moduleId: searchParams.get("moduleId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    if (parsed.data.type === "courses") {
      const courses = await Course.find()
        .sort({ sortOrder: 1, name: 1 })
        .select("name")
        .lean();
      return NextResponse.json({
        success: true,
        items: courses.map((course) => ({
          id: course._id.toString(),
          name: course.name,
        })),
      });
    }

    if (parsed.data.type === "modules") {
      const modules = await Module.find({ course: toObjectId(parsed.data.courseId) })
        .sort({ sortOrder: 1, title: 1 })
        .select("title")
        .lean();
      return NextResponse.json({
        success: true,
        items: modules.map((module) => ({
          id: module._id.toString(),
          name: module.title,
        })),
      });
    }

    const lessons = await Lesson.find({ module: toObjectId(parsed.data.moduleId) })
      .sort({ sortOrder: 1, title: 1 })
      .select("title")
      .lean();
    return NextResponse.json({
      success: true,
      items: lessons.map((lesson) => ({
        id: lesson._id.toString(),
        name: lesson.title,
      })),
    });
  } catch (error) {
    return toResourceErrorResponse(error);
  }
}
