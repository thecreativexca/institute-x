import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeSubmissionDetail } from "@/lib/office/assignments/queries";
import { gradeSubmission } from "@/lib/office/assignments/mutations";
import { gradeSubmissionSchema } from "@/lib/office/assignments/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string; submissionId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { assignmentId, submissionId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_READ)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const submission = await getOfficeSubmissionDetail(assignmentId, submissionId, user.id, user.role);

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Office submission detail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string; submissionId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { assignmentId, submissionId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_GRADE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const rawScore = formData.get("score");
    const data = {
      score: rawScore === null || rawScore === "" ? undefined : Number(rawScore),
      feedback: formData.get("feedback"),
      internalNote: formData.get("internalNote") || undefined,
      status: formData.get("status") || "graded",
    };

    const validated = gradeSubmissionSchema.safeParse(data);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues[0]?.message ?? "Invalid review details." }, { status: 400 });
    }

    const result = await gradeSubmission(assignmentId, submissionId, validated.data, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office submission PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
