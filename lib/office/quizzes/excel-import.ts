import JSZip from "jszip";
import ExcelJS from "exceljs";
import { createQuestionSchema, type CreateQuestionInput } from "./validation";

export const QUIZ_IMPORT_HEADERS = [
  "Question", "Option A", "Option B", "Option C", "Option D",
  "Correct Answer", "Marks", "Negative Marks", "Explanation",
] as const;

function decodeXmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function colLetterToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const clean = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === "\t" || ch === ";") && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((ch === "\r" || ch === "\n") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }

  return rows;
}

async function parseXlsxDirect(buffer: Buffer): Promise<string[][]> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Parse shared strings if present
  const sharedStrings: string[] = [];
  const sstFile = Object.values(zip.files).find((f) =>
    f.name.replace(/\\/g, "/").match(/xl\/sharedstrings\.xml/i)
  );

  if (sstFile) {
    const sstXml = await sstFile.async("string");
    const siRegex = /<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/gi;
    let match: RegExpExecArray | null;

    while ((match = siRegex.exec(sstXml)) !== null) {
      const siContent = match[1];
      const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi;
      const textParts: string[] = [];
      let tMatch: RegExpExecArray | null;

      while ((tMatch = tRegex.exec(siContent)) !== null) {
        textParts.push(decodeXmlEntities(tMatch[1]));
      }
      sharedStrings.push(textParts.join(""));
    }
  }

  // 2. Find primary worksheet
  const sheetFile =
    Object.values(zip.files).find((f) =>
      f.name.replace(/\\/g, "/").match(/xl\/worksheets\/sheet1\.xml/i)
    ) ||
    Object.values(zip.files).find((f) =>
      f.name.replace(/\\/g, "/").match(/xl\/worksheets\/sheet\d+\.xml/i)
    );

  if (!sheetFile) {
    throw new Error("Workbook mein koi sheet nahi mili.");
  }

  const sheetXml = await sheetFile.async("string");
  const rowRegex = /<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/gi;
  const rows: string[][] = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[2];
    const cellRegex = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/gi;
    const rowValues: string[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cellAttrs = cellMatch[1];
      const cellBody = cellMatch[2] || "";
      const refMatch = cellAttrs.match(/\br="([A-Z]+)(\d+)"/i);
      if (!refMatch) continue;

      const colIndex = colLetterToIndex(refMatch[1].toUpperCase());
      const typeMatch = cellAttrs.match(/\bt="([^"]+)"/i);
      const cellType = typeMatch ? typeMatch[1] : "";

      let val = "";
      if (cellType === "s") {
        const vMatch = cellBody.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i);
        if (vMatch) {
          const sstIdx = parseInt(vMatch[1].trim(), 10);
          val = sharedStrings[sstIdx] ?? "";
        }
      } else if (cellType === "inlineStr") {
        const tRegex = /<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/gi;
        const parts: string[] = [];
        let tMatch: RegExpExecArray | null;
        while ((tMatch = tRegex.exec(cellBody)) !== null) {
          parts.push(decodeXmlEntities(tMatch[1]));
        }
        val = parts.join("");
      } else {
        const vMatch = cellBody.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/i);
        if (vMatch) {
          val = decodeXmlEntities(vMatch[1].trim());
        }
      }

      rowValues[colIndex] = val;
    }

    if (rowValues.some((v) => v && v.trim() !== "")) {
      rows.push(rowValues);
    }
  }

  return rows;
}

async function parseWithExcelJsFallback(buffer: Buffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Workbook mein koi sheet nahi hai.");

  const rows: string[][] = [];
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const rowValues: string[] = [];
    for (let c = 1; c <= 20; c++) {
      const cell = row.getCell(c);
      const val = cell.value;
      if (val === null || val === undefined) {
        rowValues.push("");
      } else if (typeof val === "object") {
        if ("text" in val) rowValues.push(String(val.text).trim());
        else if ("result" in val) rowValues.push(String(val.result ?? "").trim());
        else if ("richText" in val) rowValues.push(val.richText.map((p) => p.text).join("").trim());
        else rowValues.push(String(val).trim());
      } else {
        rowValues.push(String(val).trim());
      }
    }
    if (rowValues.some((v) => v !== "")) {
      rows.push(rowValues);
    }
  }
  return rows;
}

async function extractTableRows(buffer: Buffer): Promise<string[][]> {
  const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b; // 'PK' magic bytes
  if (isZip) {
    try {
      // Primary: Direct OpenXML extraction (immune to ExcelJS XML namespace and streaming bugs)
      const directRows = await parseXlsxDirect(buffer);
      if (directRows.length > 0) return directRows;
    } catch (directErr) {
      console.warn("Direct XLSX parse warning, trying ExcelJS fallback:", directErr);
    }

    // Fallback to ExcelJS
    return await parseWithExcelJsFallback(buffer);
  }

  // Not a zip archive: Parse as CSV text
  return parseCsv(buffer.toString("utf-8"));
}

function normalizeHeader(str: string): string {
  return str.trim().toLowerCase().replace(/[\s_-]+/g, " ");
}

export async function parseQuizWorkbook(buffer: Buffer): Promise<CreateQuestionInput[]> {
  const rows = await extractTableRows(buffer);

  if (rows.length < 2) {
    throw new Error("Sheet mein kam se kam 1 header row aur 1 question row hona chahiye.");
  }

  const headerRow = rows[0];

  // Map header names to column indexes
  const colMap: Record<string, number> = {
    question: -1,
    optionA: -1,
    optionB: -1,
    optionC: -1,
    optionD: -1,
    correctAnswer: -1,
    marks: -1,
    negativeMarks: -1,
    explanation: -1,
  };

  headerRow.forEach((val, idx) => {
    const norm = normalizeHeader(val || "");
    if (norm === "question" || norm === "q") colMap.question = idx;
    else if (norm === "option a" || norm === "opt a" || norm === "a") colMap.optionA = idx;
    else if (norm === "option b" || norm === "opt b" || norm === "b") colMap.optionB = idx;
    else if (norm === "option c" || norm === "opt c" || norm === "c") colMap.optionC = idx;
    else if (norm === "option d" || norm === "opt d" || norm === "d") colMap.optionD = idx;
    else if (norm === "correct answer" || norm === "correct option" || norm === "answer" || norm === "ans" || norm === "correct") colMap.correctAnswer = idx;
    else if (norm === "marks" || norm === "mark" || norm === "score") colMap.marks = idx;
    else if (norm === "negative marks" || norm === "negative mark" || norm === "negative") colMap.negativeMarks = idx;
    else if (norm === "explanation" || norm === "explain" || norm === "solution") colMap.explanation = idx;
  });

  // Fallback to positional headers (1st = Question, 2nd = Option A, etc.) if not matched by name
  if (colMap.question === -1) colMap.question = 0;
  if (colMap.optionA === -1) colMap.optionA = 1;
  if (colMap.optionB === -1) colMap.optionB = 2;
  if (colMap.optionC === -1) colMap.optionC = 3;
  if (colMap.optionD === -1) colMap.optionD = 4;
  if (colMap.correctAnswer === -1) colMap.correctAnswer = 5;
  if (colMap.marks === -1) colMap.marks = 6;
  if (colMap.negativeMarks === -1) colMap.negativeMarks = 7;
  if (colMap.explanation === -1) colMap.explanation = 8;

  // Validate that the first row is indeed headers
  const qHeader = normalizeHeader(headerRow[colMap.question] || "");
  const optAHeader = normalizeHeader(headerRow[colMap.optionA] || "");
  const optBHeader = normalizeHeader(headerRow[colMap.optionB] || "");

  if (
    !qHeader.includes("question") &&
    !optAHeader.includes("option") &&
    !optAHeader.includes("a") &&
    !optBHeader.includes("option") &&
    !optBHeader.includes("b")
  ) {
    throw new Error(
      "Header row format galat hai. Columns hone chahiye: Question, Option A, Option B, Option C, Option D, Correct Answer, Marks, Negative Marks, Explanation."
    );
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > 500) {
    throw new Error("Ek file mein maximum 500 questions upload karein.");
  }

  const questions: CreateQuestionInput[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 2;
    const row = dataRows[i];

    const questionText = (row[colMap.question] ?? "").trim();
    const optionAText = (row[colMap.optionA] ?? "").trim();
    const optionBText = (row[colMap.optionB] ?? "").trim();
    const optionCText = (row[colMap.optionC] ?? "").trim();
    const optionDText = (row[colMap.optionD] ?? "").trim();
    const answerText = (row[colMap.correctAnswer] ?? "").trim();
    const marksText = (row[colMap.marks] ?? "").trim();
    const negativeText = (row[colMap.negativeMarks] ?? "").trim();
    const explanationText = (row[colMap.explanation] ?? "").trim();

    // Skip entirely blank rows
    if (
      !questionText &&
      !optionAText &&
      !optionBText &&
      !optionCText &&
      !optionDText &&
      !answerText
    ) {
      continue;
    }

    if (!questionText) {
      throw new Error(`Row ${rowNumber}: Question text required hai.`);
    }

    if (!optionAText || !optionBText) {
      throw new Error(`Row ${rowNumber}: Option A aur Option B required hain.`);
    }

    const rawOptions = [
      { id: "a", text: optionAText },
      { id: "b", text: optionBText },
      { id: "c", text: optionCText },
      { id: "d", text: optionDText },
    ];
    const options = rawOptions.filter((o) => o.text.length > 0);

    if (options.length < 2) {
      throw new Error(`Row ${rowNumber}: Kam se kam 2 options required hain.`);
    }

    // Clean & resolve correct option
    let cleanAns = answerText.toLowerCase().replace(/^option\s*/i, "").replace(/^[\(\[]|[\)\].:]+$/g, "").trim();
    if (cleanAns === "1") cleanAns = "a";
    else if (cleanAns === "2") cleanAns = "b";
    else if (cleanAns === "3") cleanAns = "c";
    else if (cleanAns === "4") cleanAns = "d";

    let correctOptionId = "";
    if (options.some((o) => o.id === cleanAns)) {
      correctOptionId = cleanAns;
    } else {
      const matchByText = options.find((o) => o.text.toLowerCase() === answerText.toLowerCase());
      if (matchByText) {
        correctOptionId = matchByText.id;
      }
    }

    if (!correctOptionId) {
      throw new Error(
        `Row ${rowNumber}: Correct Answer '${answerText}' valid nahi hai. Available options: ${options.map((o) => o.id.toUpperCase()).join(", ")}.`
      );
    }

    let marks = 1;
    if (marksText !== "") {
      const parsed = Number(marksText);
      if (Number.isNaN(parsed) || parsed < 1) {
        throw new Error(`Row ${rowNumber}: Marks kam se kam 1 whole number hona chahiye.`);
      }
      marks = Math.round(parsed);
    }

    let negativeMarks = 0;
    if (negativeText !== "") {
      const parsed = Number(negativeText);
      if (Number.isNaN(parsed) || parsed < 0) {
        throw new Error(`Row ${rowNumber}: Negative Marks 0 ya usse zyada hona chahiye.`);
      }
      negativeMarks = Math.round(parsed);
    }

    const candidate = {
      question: questionText,
      options,
      correctOptionId,
      marks,
      negativeMarks,
      explanation: explanationText,
      order: questions.length,
      isPublished: true,
    };

    const parsed = createQuestionSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new Error(`Row ${rowNumber}: ${parsed.error.issues[0].message}`);
    }

    questions.push(parsed.data);
  }

  if (questions.length === 0) {
    throw new Error("Sheet mein koi valid question nahi mila.");
  }

  return questions;
}
