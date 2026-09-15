import ExcelJS from "exceljs";
import { createQuizSchema } from "@/lib/office/quizzes/validation";
import { parseQuizWorkbook, QUIZ_IMPORT_HEADERS } from "@/lib/office/quizzes/excel-import";

async function main() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Questions");
  sheet.addRow([...QUIZ_IMPORT_HEADERS]);
  sheet.addRow(["2 + 2 kitna hai?", "3", "4", "5", "6", "B", 1, 0, "2 + 2 = 4"]);
  sheet.addRow(["Capital of India?", "Delhi", "Mumbai", "", "", "A", 2, 0.5, ""]);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  const parsed = createQuizSchema.safeParse({
    courseId: "68d1f0000000000000000000",
    moduleId: null,
    lessonId: null,
    title: "Test Quiz",
    description: "",
    instructions: "",
    type: "module",
    durationMinutes: null,
    passingPercentage: 40,
    maxAttempts: null,
    shuffleQuestions: false,
    shuffleOptions: false,
    showCorrectAnswers: true,
    availableFrom: new Date("2026-09-15T10:30").toISOString(),
    availableUntil: null,
    isPublished: false,
  });
  console.log("quiz schema ok?", parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues, null, 2));

  try {
    const questions = await parseQuizWorkbook(buffer);
    console.log("questions ok:", questions.length);
    console.log(JSON.stringify(questions, null, 2));
  } catch (error) {
    console.log("parseQuizWorkbook threw:", error instanceof Error ? error.message : error);
  }
}

main().catch((e) => console.error("fatal:", e));
