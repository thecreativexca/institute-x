import ExcelJS from "exceljs";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { QUIZ_IMPORT_HEADERS } from "@/lib/office/quizzes/excel-import";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await getValidatedSession();
  if (!user || !canAccessAdmin(user.role)) return new Response("Forbidden", { status: 403 });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Questions");
  sheet.addRow([...QUIZ_IMPORT_HEADERS]);
  sheet.addRow(["2 + 2 kitna hai?", "3", "4", "5", "6", "B", 1, 0, "2 + 2 = 4"]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => { column.width = 22; });
  sheet.getColumn(1).width = 50;
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="quiz-import-template.xlsx"',
    },
  });
}
