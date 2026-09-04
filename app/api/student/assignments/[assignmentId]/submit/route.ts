import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { requireStudentApi } from "@/lib/auth/helpers";
import { SUBMISSION_STATUSES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { assertEnrollment } from "@/lib/resources/access";
import { deleteResourceAsset, uploadResourceAsset } from "@/lib/resources/cloudinary";
import { sanitizePublicIdBase, validateResourceFile } from "@/lib/resources/validation";
import { Assignment } from "@/models/Assignment";
import { Course } from "@/models/Course";
import { Submission } from "@/models/Submission";
import { notifyAdmins } from "@/lib/notifications/service";

const contentSchema = z.string().trim().max(20_000, "Answer is too long.");
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse;
  try {
    const { assignmentId } = await params;
    if (!Types.ObjectId.isValid(assignmentId)) return NextResponse.json({ success: false, error: "Assignment not found." }, { status: 404 });
    const formData = await request.formData();
    const parsedContent = contentSchema.safeParse(String(formData.get("content") ?? ""));
    if (!parsedContent.success) return NextResponse.json({ success: false, error: parsedContent.error.issues[0]?.message ?? "Invalid answer." }, { status: 400 });
    await connectDB();
    const assignment = await Assignment.findOne({ _id: assignmentId, isPublished: true });
    if (!assignment) return NextResponse.json({ success: false, error: "Assignment not found." }, { status: 404 });
    const course = await Course.findOne({ _id: assignment.course, status: "published" }).select("name slug").lean();
    if (!course) return NextResponse.json({ success: false, error: "Course is unavailable." }, { status: 404 });
    await assertEnrollment(user.id, assignment.course.toString());
    const existing = await Submission.findOne({ student: user.id, assignment: assignment._id });
    if (existing?.status === SUBMISSION_STATUSES.GRADED) return NextResponse.json({ success: false, error: "This assignment has already been graded." }, { status: 409 });

    const file = formData.get("file");
    let uploaded: { publicId: string; fileUrl: string } | null = null;
    let originalFileName: string | undefined;
    if (file instanceof File && file.size > 0) {
      const validated = await validateResourceFile(file);
      originalFileName = validated.originalFileName;
      uploaded = await uploadResourceAsset({ buffer: validated.buffer, folder: `education-institute/assignments/${assignment._id.toString()}/${user.id}`, publicId: `${sanitizePublicIdBase(file.name)}-${randomBytes(6).toString("hex")}`, mimeType: validated.mimeType });
    }
    if (!parsedContent.data && !uploaded && !existing?.fileUrl) return NextResponse.json({ success: false, error: "Add a written answer or attach a file." }, { status: 400 });
    const oldPublicId = existing?.publicId;
    const now = new Date();
    const submission = await Submission.findOneAndUpdate(
      { student: user.id, assignment: assignment._id },
      { $set: { course: assignment.course, content: parsedContent.data || undefined, ...(uploaded ? { fileUrl: uploaded.fileUrl, publicId: uploaded.publicId, originalFileName } : {}), status: SUBMISSION_STATUSES.SUBMITTED, submittedAt: now, gradedAt: null, score: null, totalMarks: null, feedback: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (uploaded && oldPublicId && oldPublicId !== uploaded.publicId) void deleteResourceAsset(oldPublicId);
    try {
      const { sendAssignmentSubmittedEmail } = await import("@/lib/email/events");
      await sendAssignmentSubmittedEmail({ studentId: user.id, studentName: user.name, studentEmail: user.email, courseId: course._id.toString(), courseName: course.name, assignmentId: assignment._id.toString(), assignmentTitle: assignment.title, submissionId: submission._id.toString(), submissionNumber: Number.parseInt(submission._id.toString().slice(-6), 16), submittedAt: now });
    } catch (emailError) { console.error("Assignment submission email failed:", emailError); }
    try {
      await notifyAdmins({ title: "Assignment submitted", message: `${user.name} submitted “${assignment.title}” for ${course.name}.`, type: "info", link: `/office/assignments/${assignment._id.toString()}/submissions/${submission._id.toString()}` });
    } catch (notificationError) { console.error("Assignment notification failed:", notificationError); }
    return NextResponse.json({ success: true, submissionId: submission._id.toString() });
  } catch (error) {
    console.error("Assignment submission failed:", error);
    return NextResponse.json({ success: false, error: "Unable to submit the assignment. Check the file and try again." }, { status: 500 });
  }
}
