import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeQuizQuestionDetail } from "@/lib/office/quizzes/queries";
import { updateQuestion, deleteQuestion } from "@/lib/office/quizzes/mutations";
import { updateQuestionSchema } from "@/lib/office/quizzes/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId, questionId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_READ)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const question = await getOfficeQuizQuestionDetail(quizId, questionId, user.id, user.role);

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Office quiz question GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId, questionId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const data = {
      question: formData.get("question") as string | undefined,
      options: formData.get("options") ? JSON.parse(formData.get("options") as string) : undefined,
      correctOptionId: formData.get("correctOptionId") as string | undefined,
      marks: formData.get("marks") ? parseInt(formData.get("marks") as string, 10) : undefined,
      negativeMarks: formData.get("negativeMarks") ? parseInt(formData.get("negativeMarks") as string, 10) : undefined,
      explanation: formData.get("explanation") as string | undefined,
      order: formData.get("order") ? parseInt(formData.get("order") as string, 10) : undefined,
      isPublished: formData.get("isPublished") === "true" ? true : formData.get("isPublished") === "false" ? false : undefined,
    };

    const validated = updateQuestionSchema.parse(data);

    const result = await updateQuestion(quizId, questionId, validated, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office quiz question PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; questionId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId, questionId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const result = await deleteQuestion(quizId, questionId, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Office quiz question DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}