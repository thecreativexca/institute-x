import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { createQuizSchema } from "@/lib/office/quizzes/validation";
import { parseQuizWorkbook } from "@/lib/office/quizzes/excel-import";
import { createQuizWithQuestions } from "@/lib/office/quizzes/mutations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user } = await getValidatedSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessAdmin(user.role) || !hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !/\.(xlsx|csv)$/i.test(file.name) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "5 MB se chhoti .xlsx ya .csv file upload karein." }, { status: 400 });
    }
    const date = (field: string) => {
      const value = form.get(field);
      if (!value) return null;
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) throw new Error(`${field} ki date valid nahi hai.`);
      return parsed.toISOString();
    };
    const parsedQuiz = createQuizSchema.safeParse({
      courseId: String(form.get("courseId") ?? ""),
      moduleId: String(form.get("moduleId") ?? "") || null,
      lessonId: String(form.get("lessonId") ?? "") || null,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      instructions: String(form.get("instructions") ?? ""),
      type: String(form.get("type") ?? ""),
      durationMinutes: form.get("durationMinutes") ? Number(form.get("durationMinutes")) : null,
      passingPercentage: Number(form.get("passingPercentage")),
      maxAttempts: form.get("maxAttempts") ? Number(form.get("maxAttempts")) : null,
      shuffleQuestions: form.get("shuffleQuestions") === "true",
      shuffleOptions: form.get("shuffleOptions") === "true",
      showCorrectAnswers: form.get("showCorrectAnswers") !== "false",
      availableFrom: date("availableFrom"),
      availableUntil: date("availableUntil"),
      isPublished: false,
    });
    if (!parsedQuiz.success) {
      return NextResponse.json({ error: parsedQuiz.error.issues[0].message }, { status: 400 });
    }
    const questions = await parseQuizWorkbook(Buffer.from(await file.arrayBuffer()));
    const result = await createQuizWithQuestions(parsedQuiz.data, questions, user.id, user.role);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, ...result, questionCount: questions.length });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Quiz import error:", error);
    return NextResponse.json({ error: "Excel import fail hua. File format check karein." }, { status: 400 });
  }
}
