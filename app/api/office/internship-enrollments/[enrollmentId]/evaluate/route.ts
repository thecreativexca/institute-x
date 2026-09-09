import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { InternshipEvaluation } from "@/models/InternshipEvaluation";
import { InternshipEnrollment } from "@/models/InternshipEnrollment";
import { gradeFor, objectId, serialize } from "@/lib/internships/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user) return errorResponse!;
  try {
    const { criteria, adminFeedback } = await request.json();
    if (!Array.isArray(criteria) || !criteria.length)
      return NextResponse.json(
        { success: false, error: "Evaluation criteria are required." },
        { status: 400 },
      );
    const total = criteria.reduce(
        (n: any, c: any) => n + Number(c.score || 0),
        0,
      ),
      max = criteria.reduce((n: any, c: any) => n + Number(c.maxScore || 0), 0);
    if (
      !max ||
      criteria.some(
        (c: any) => c.score < 0 || c.maxScore <= 0 || c.score > c.maxScore,
      )
    )
      return NextResponse.json(
        { success: false, error: "Invalid evaluation scores." },
        { status: 400 },
      );
    const percentage = Math.round((total / max) * 100),
      grade = gradeFor(percentage);
    await connectDB();
    const enrollment = await InternshipEnrollment.findById(
      objectId((await params).enrollmentId),
    );
    if (!enrollment)
      return NextResponse.json(
        { success: false, error: "Enrollment not found." },
        { status: 404 },
      );
    const evaluation = await InternshipEvaluation.findOneAndUpdate(
      { student: enrollment.student, internship: enrollment.internship },
      {
        $set: {
          criteria,
          totalScore: total,
          percentage,
          grade,
          adminFeedback,
          evaluatedAt: new Date(),
          evaluatedBy: user.id,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    enrollment.finalScore = percentage;
    enrollment.grade = grade;
    await enrollment.save();
    return NextResponse.json({
      success: true,
      data: serialize(evaluation.toObject()),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to evaluate.",
      },
      { status: 400 },
    );
  }
}
