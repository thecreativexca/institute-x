import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeQuizQuestions, getOfficeQuizQuestionDetail } from "@/lib/office/quizzes/queries";
import { createQuestion, reorderQuestions } from "@/lib/office/quizzes/mutations";
import { createQuestionSchema, reorderQuestionsSchema } from "@/lib/office/quizzes/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_READ)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const questions = await getOfficeQuizQuestions(quizId, user.id, user.role);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Office quiz questions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId } = await params;

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
    const action = formData.get("action") as string;

    if (action === "reorder") {
      const questionOrders = JSON.parse(formData.get("questionOrders") as string);
      const validated = reorderQuestionsSchema.parse({ questionOrders });
      const result = await reorderQuestions(quizId, validated, user.id, user.role);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const data = {
      question: formData.get("question") as string,
      options: JSON.parse(formData.get("options") as string),
      correctOptionId: formData.get("correctOptionId") as string,
      marks: parseInt(formData.get("marks") as string, 10),
      negativeMarks: formData.get("negativeMarks") ? parseInt(formData.get("negativeMarks") as string, 10) : undefined,
      explanation: formData.get("explanation") as string | undefined,
      order: formData.get("order") ? parseInt(formData.get("order") as string, 10) : undefined,
      isPublished: formData.get("isPublished") === "true",
    };

    const validated = createQuestionSchema.parse(data);

    const result = await createQuestion(quizId, validated, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, questionId: result.questionId });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office quiz questions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}