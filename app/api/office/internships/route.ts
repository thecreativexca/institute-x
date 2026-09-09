import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Internship } from "@/models/Internship";
import {
  objectId,
  optionalNumber,
  parseDateInput,
  serialize,
  slugify,
} from "@/lib/internships/service";
import { Enrollment } from "@/models/Enrollment";
import { User } from "@/models/User";
import { notifyUsers, safeNotify } from "@/lib/notifications/service";
export async function GET(request: NextRequest) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  await connectDB();
  const q = request.nextUrl.searchParams,
    page = Math.max(1, Number(q.get("page") || 1)),
    limit = Math.min(50, Math.max(1, Number(q.get("limit") || 12)));
  const filter: any = {};
  if (q.get("status")) filter.status = q.get("status");
  if (q.get("mode")) filter.mode = q.get("mode");
  if (q.get("course")) filter.eligibleCourses = q.get("course");
  if (q.get("search")) filter.$text = { $search: q.get("search") };
  const [rows, total] = await Promise.all([
    Internship.find(filter)
      .populate("eligibleCourses", "name")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Internship.countDocuments(filter),
  ]);
  return NextResponse.json({
    success: true,
    data: rows.map(serialize),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.description?.trim())
      return NextResponse.json(
        { success: false, error: "Title and description are required." },
        { status: 400 },
      );
    await connectDB();
    const row = await Internship.create({
      title: body.title.trim(),
      description: body.description.trim(),
      shortDescription: body.shortDescription || "",
      durationValue: Number(body.durationValue) || 1,
      durationUnit: body.durationUnit || "weeks",
      mode: body.mode || "remote",
      paidOrUnpaid: body.paidOrUnpaid || "unpaid",
      stipendAmount: optionalNumber(body.stipendAmount),
      seats: Math.max(1, Number(body.seats) || 1),
      skillsRequired: Array.isArray(body.skillsRequired)
        ? body.skillsRequired.filter(Boolean)
        : [],
      eligibleCourses: (body.eligibleCourses || [])
        .filter(Boolean)
        .map((id: string) => objectId(id)),
      minimumCourseProgress: optionalNumber(body.minimumCourseProgress),
      courseCompletionRequired: Boolean(body.courseCompletionRequired),
      applicationRequired: body.applicationRequired !== false,
      autoApproval: Boolean(body.autoApproval),
      openToAllActiveStudents: Boolean(body.openToAllActiveStudents),
      status: body.status === "open" ? "open" : "draft",
      applicationEndDate: parseDateInput(body.applicationEndDate),
      completionRules: body.completionRules || {
        requireTasks: true,
        requireProjects: true,
        minimumProgress: 100,
      },
      slug: slugify(body.slug || body.title),
      createdBy: user.id,
      updatedBy: user.id,
    });
    if (row.status === "open") {
      let recipientIds: string[] = [];
      if (row.openToAllActiveStudents) {
        recipientIds = await User.find({ role: "student", status: "active" }).distinct("_id").then((ids) => ids.map(String));
      } else if (row.eligibleCourses?.length) {
        recipientIds = await Enrollment.find({
          course: { $in: row.eligibleCourses },
          status: { $in: ["active", "completed"] },
        }).distinct("student").then((ids) => ids.map(String));
      }
      if (recipientIds.length) {
        await safeNotify(
          () =>
            notifyUsers(recipientIds, {
              title: "New internship opportunity",
              message: `“${row.title}” is now open for applications.`,
              type: "info",
              link: `/student/internships/${row._id.toString()}`,
            }),
          "Internship publish",
        );
      }
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
            ? "That internship slug is already in use."
            : e?.message || "Unable to create internship.",
      },
      { status: 400 },
    );
  }
}
