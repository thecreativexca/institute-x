import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/models/Project";
import {
  objectId,
  optionalNumber,
  optionalObjectId,
  parseDateInput,
  serialize,
  slugify,
} from "@/lib/internships/service";
import { Enrollment } from "@/models/Enrollment";
import { InternshipEnrollment } from "@/models/InternshipEnrollment";
import { notifyUsers, safeNotify } from "@/lib/notifications/service";
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  await connectDB();
  const q = request.nextUrl.searchParams,
    filter: any = {};
  for (const key of ["status", "course", "internship"]) {
    const v = q.get(key);
    if (v) filter[key] = v;
  }
  if (q.get("search")) filter.$text = { $search: q.get("search") };
  const rows = await Project.find(filter)
    .populate("course", "name")
    .populate("internship", "title")
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json({ success: true, data: rows.map(serialize) });
}
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    if (!body.title || !body.description)
      return NextResponse.json(
        { success: false, error: "Title and description are required." },
        { status: 400 },
      );
    await connectDB();
    const row = await Project.create({
      title: String(body.title).trim(),
      description: body.description,
      instructions: body.instructions || "",
      course: optionalObjectId(body.course),
      internship: optionalObjectId(body.internship),
      assignedStudents: (body.assignedStudents || [])
        .filter(Boolean)
        .map((id: string) => objectId(id)),
      difficulty: body.difficulty || "beginner",
      dueDate: parseDateInput(body.dueDate),
      totalMarks: Math.max(1, Number(body.totalMarks) || 100),
      passingMarks: optionalNumber(body.passingMarks),
      required: body.required !== false,
      allowLateSubmission: Boolean(body.allowLateSubmission),
      submissionRequirements: Array.isArray(body.submissionRequirements)
        ? body.submissionRequirements.filter(Boolean)
        : [],
      status: body.status === "draft" ? "draft" : "published",
      slug: slugify(body.slug || body.title),
      createdBy: user.id,
      updatedBy: user.id,
    });
    if (row.status === "published") {
      const recipientIds = new Set<string>(
        row.assignedStudents.map((id) => id.toString()),
      );
      if (row.course) {
        const courseStudents = await Enrollment.find({
          course: row.course,
          status: { $in: ["active", "completed"] },
        }).distinct("student");
        courseStudents.forEach((id) => recipientIds.add(id.toString()));
      }
      if (row.internship) {
        const internshipStudents = await InternshipEnrollment.find({
          internship: row.internship,
          status: { $in: ["selected", "active", "paused", "completed"] },
        }).distinct("student");
        internshipStudents.forEach((id) => recipientIds.add(id.toString()));
      }
      await safeNotify(
        () =>
          notifyUsers([...recipientIds], {
            title: "New project assigned",
            message: `“${row.title}” is now available in your projects list.`,
            type: "info",
            link: `/student/projects/${row._id.toString()}`,
          }),
        "Project publish",
      );
    }
    return NextResponse.json(
      { success: true, data: serialize(row.toObject()) },
      { status: 201 },
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          e?.code === 11000
            ? "That project slug is already used."
            : e?.message || "Unable to create project.",
      },
      { status: 400 },
    );
  }
}
