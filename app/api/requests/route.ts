import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/db/connect";
import { AdmissionRequest } from "@/models/AdmissionRequest";
import { Course } from "@/models/Course";
import { CATALOG_COURSES } from "@/lib/config/catalog";

const requestSchema = z.object({
  type: z.enum(["contact", "enrollment"]),
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  phone: z.string().trim().min(8, "Please enter a valid phone number.").max(24),
  email: z.union([z.literal(""), z.string().trim().email("Please enter a valid email address.").max(160)]).optional(),
  courseSlug: z.string().trim().max(160).optional(),
  message: z.string().trim().max(1500).optional(),
  sourcePath: z.string().trim().max(300).optional(),
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Please check your details." },
        { status: 400 }
      );
    }

    if (parsed.data.website) {
      return NextResponse.json({ success: true });
    }

    await connectDB();
    const course = parsed.data.courseSlug
      ? await Course.findOne({ slug: parsed.data.courseSlug, status: "published" }).select("_id name").lean()
      : null;
    const fallbackCourse = !course && parsed.data.courseSlug
      ? CATALOG_COURSES.find((item) => item.slug === parsed.data.courseSlug && item.status === "published")
      : undefined;
    const courseName = course?.name ?? fallbackCourse?.name;

    if (parsed.data.type === "enrollment" && !courseName) {
      return NextResponse.json({ success: false, error: "This course is not available right now." }, { status: 400 });
    }

    const created = await AdmissionRequest.create({
      type: parsed.data.type,
      status: "new",
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      course: course?._id ?? null,
      courseName,
      message: parsed.data.message,
      sourcePath: parsed.data.sourcePath,
    });

    return NextResponse.json(
      { success: true, requestId: created._id.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public admission request failed:", error);
    return NextResponse.json(
      { success: false, error: "We could not submit your request. Please call us at 9501013548." },
      { status: 500 }
    );
  }
}
