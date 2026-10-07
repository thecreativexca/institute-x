import { Readable } from "node:stream";

import ExcelJS from "exceljs";
import { Types, type ClientSession } from "mongoose";

import { LESSON_CONTENT_TYPES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import { normalizeYouTubeUrl, parseYouTubeVideoId } from "./youtube";
import {
  type CurriculumCsvError,
  type CurriculumCsvImportResult,
  type CurriculumCsvPreview,
} from "./curriculum-csv-shared";

const REQUIRED_HEADERS = [
  "module_order",
  "module_title",
  "lesson_order",
  "lesson_title",
  "lesson_type",
] as const;

const MAX_CSV_ROWS = 2_500;
export const MAX_CURRICULUM_CSV_BYTES = 2 * 1024 * 1024;

type LessonType = "youtube" | "text" | "pdf";

interface ParsedLesson {
  row: number;
  order: number;
  title: string;
  type: LessonType;
  youtubeUrl: string;
  textContent: string;
  pdfUrl: string;
  description: string;
  durationMinutes?: number;
  isPreview: boolean;
  isPublished: boolean;
}

interface ParsedModule {
  order: number;
  title: string;
  description: string;
  lessons: ParsedLesson[];
}

export interface ParsedCurriculumCsv {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: CurriculumCsvError[];
  modules: ParsedModule[];
}

type RawRow = Record<string, string>;

function normalizedKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function parsePositiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalDuration(value: string): number | null | undefined {
  if (!value.trim()) return undefined;
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 600 ? parsed : null;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function addError(errors: CurriculumCsvError[], row: number, message: string): void {
  if (!errors.some((error) => error.row === row && error.message === message)) {
    errors.push({ row, message });
  }
}

async function readRows(text: string): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = await workbook.csv.read(Readable.from([text]), {
    map: (value) => value,
    parserOptions: {
      ignoreEmpty: true,
      trim: false,
    },
  });

  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as Array<ExcelJS.CellValue>;
    rows.push(values.slice(1).map((value) => (value == null ? "" : String(value))));
  });
  return rows;
}

export async function parseCurriculumCsv(text: string): Promise<ParsedCurriculumCsv> {
  let rows: string[][];
  try {
    rows = await readRows(text.replace(/^\uFEFF/, ""));
  } catch {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 1, message: "The file is not valid CSV. Check its quotes and delimiters." }],
      modules: [],
    };
  }

  if (rows.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: 1, message: "The CSV file is empty." }],
      modules: [],
    };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const errors: CurriculumCsvError[] = [];
  const seenHeaders = new Set<string>();
  for (const header of headers) {
    if (header && seenHeaders.has(header)) addError(errors, 1, `Duplicate column: ${header}.`);
    seenHeaders.add(header);
  }
  for (const header of REQUIRED_HEADERS) {
    if (!headers.includes(header)) addError(errors, 1, `Missing required column: ${header}.`);
  }

  const dataRows = rows.slice(1);
  if (dataRows.length === 0) {
    addError(errors, 2, "The CSV does not contain any lesson rows.");
    return { totalRows: 0, validRows: 0, invalidRows: 0, errors, modules: [] };
  }
  if (dataRows.length > MAX_CSV_ROWS) {
    addError(errors, 1, `CSV files can contain at most ${MAX_CSV_ROWS.toLocaleString()} lesson rows.`);
  }

  const hasHeaderError = errors.some((error) => error.row === 1);
  if (hasHeaderError) {
    return {
      totalRows: dataRows.length,
      validRows: 0,
      invalidRows: dataRows.length,
      errors,
      modules: [],
    };
  }

  const rawRows: Array<{ row: number; data: RawRow }> = dataRows.map((values, index) => ({
    row: index + 2,
    data: Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""])),
  }));

  const candidateRows: Array<{
    row: number;
    moduleOrder: number;
    moduleTitle: string;
    moduleDescription: string;
    lesson: ParsedLesson;
  }> = [];
  const moduleOrderOwners = new Map<number, string>();
  const moduleTitleOwners = new Map<string, number>();
  const lessonOrders = new Set<string>();
  const lessonTitles = new Set<string>();

  for (const { row, data } of rawRows) {
    const rowErrorCount = errors.length;
    const moduleOrder = parsePositiveInteger(data.module_order);
    const lessonOrder = parsePositiveInteger(data.lesson_order);
    const moduleTitle = data.module_title.trim();
    const lessonTitle = data.lesson_title.trim();
    const lessonType = data.lesson_type.trim().toLowerCase();
    const moduleDescription = (data.module_description ?? "").trim();
    const youtubeUrl = (data.youtube_url ?? "").trim();
    const textContent = data.text_content ?? "";
    const pdfUrl = (data.pdf_url ?? "").trim();
    const description = data.lesson_description ?? "";
    const durationMinutes = parseOptionalDuration(data.duration_minutes ?? "");
    const isPreview = parseBoolean(data.is_preview ?? "");
    const isPublished = parseBoolean(data.is_published ?? "");

    if (moduleOrder === null) addError(errors, row, "module_order must be a positive whole number.");
    if (!moduleTitle) addError(errors, row, "Missing module_title.");
    else if (moduleTitle.length > 150) addError(errors, row, "module_title must be 150 characters or fewer.");
    if (moduleDescription.length > 500) addError(errors, row, "module_description must be 500 characters or fewer.");
    if (lessonOrder === null) addError(errors, row, "lesson_order must be a positive whole number.");
    if (!lessonTitle) addError(errors, row, "Missing lesson_title.");
    else if (lessonTitle.length > 200) addError(errors, row, "lesson_title must be 200 characters or fewer.");
    if (!(["youtube", "text", "pdf"] as string[]).includes(lessonType)) {
      addError(errors, row, "Invalid lesson_type. Use youtube, text, or pdf.");
    }
    if (youtubeUrl && !isHttpUrl(youtubeUrl)) addError(errors, row, "youtube_url must be a valid HTTP or HTTPS URL.");
    if (pdfUrl && !isHttpUrl(pdfUrl)) addError(errors, row, "pdf_url must be a valid HTTP or HTTPS URL.");
    if (lessonType === "youtube" && !youtubeUrl) addError(errors, row, "youtube_url is required for YouTube lessons.");
    if (lessonType === "youtube" && youtubeUrl && !parseYouTubeVideoId(youtubeUrl)) {
      addError(errors, row, "youtube_url is not a supported YouTube URL.");
    }
    if (lessonType === "text" && !textContent.trim()) addError(errors, row, "text_content is required for text lessons.");
    if (lessonType === "pdf" && !pdfUrl) addError(errors, row, "pdf_url is required for PDF lessons.");
    if (textContent.length > 20_000) addError(errors, row, "text_content must be 20,000 characters or fewer.");
    if (description.length > 20_000) addError(errors, row, "lesson_description must be 20,000 characters or fewer.");
    if (lessonType === "text" && [description.trim(), textContent].filter(Boolean).join("\n\n").length > 20_000) {
      addError(errors, row, "Combined lesson_description and text_content must be 20,000 characters or fewer.");
    }
    if (durationMinutes === null) addError(errors, row, "duration_minutes must be a whole number from 0 to 600.");
    if (isPreview === null) addError(errors, row, "is_preview must be true or false.");
    if (isPublished === null) addError(errors, row, "is_published must be true or false.");

    if (moduleOrder !== null && moduleTitle) {
      const titleKey = normalizedKey(moduleTitle);
      const orderOwner = moduleOrderOwners.get(moduleOrder);
      const titleOwner = moduleTitleOwners.get(titleKey);
      if (orderOwner && orderOwner !== titleKey) {
        addError(errors, row, `module_order ${moduleOrder} is already used by another module.`);
      }
      if (titleOwner !== undefined && titleOwner !== moduleOrder) {
        addError(errors, row, `module_title is already used with module_order ${titleOwner}.`);
      }
      moduleOrderOwners.set(moduleOrder, titleKey);
      moduleTitleOwners.set(titleKey, moduleOrder);

      if (lessonOrder !== null && lessonTitle) {
        const moduleKey = `${moduleOrder}:${titleKey}`;
        const lessonOrderKey = `${moduleKey}:${lessonOrder}`;
        const lessonTitleKey = `${moduleKey}:${normalizedKey(lessonTitle)}`;
        if (lessonOrders.has(lessonOrderKey)) addError(errors, row, `lesson_order ${lessonOrder} is duplicated in this module.`);
        if (lessonTitles.has(lessonTitleKey)) addError(errors, row, "lesson_title is duplicated in this module.");
        lessonOrders.add(lessonOrderKey);
        lessonTitles.add(lessonTitleKey);
      }
    }

    if (
      errors.length === rowErrorCount &&
      moduleOrder !== null &&
      lessonOrder !== null &&
      isPreview !== null &&
      isPublished !== null &&
      durationMinutes !== null
    ) {
      candidateRows.push({
        row,
        moduleOrder,
        moduleTitle,
        moduleDescription,
        lesson: {
          row,
          order: lessonOrder,
          title: lessonTitle,
          type: lessonType as LessonType,
          youtubeUrl,
          textContent,
          pdfUrl,
          description,
          durationMinutes,
          isPreview,
          isPublished,
        },
      });
    }
  }

  const modulesByKey = new Map<string, ParsedModule>();
  for (const item of candidateRows) {
    const key = `${item.moduleOrder}:${normalizedKey(item.moduleTitle)}`;
    const existing = modulesByKey.get(key);
    if (existing) {
      if (!existing.description && item.moduleDescription) existing.description = item.moduleDescription;
      existing.lessons.push(item.lesson);
    } else {
      modulesByKey.set(key, {
        order: item.moduleOrder,
        title: item.moduleTitle,
        description: item.moduleDescription,
        lessons: [item.lesson],
      });
    }
  }

  const modules = [...modulesByKey.values()]
    .sort((a, b) => a.order - b.order)
    .map((module) => ({
      ...module,
      lessons: module.lessons.sort((a, b) => a.order - b.order),
    }));
  const invalidRowNumbers = new Set(errors.filter((error) => error.row > 1).map((error) => error.row));

  return {
    totalRows: dataRows.length,
    validRows: dataRows.length - invalidRowNumbers.size,
    invalidRows: invalidRowNumbers.size,
    errors,
    modules,
  };
}

interface ExistingCurriculum {
  modules: Array<{ _id: Types.ObjectId; title: string; sortOrder: number }>;
  lessons: Array<{ module: Types.ObjectId; title: string; sortOrder: number }>;
}

async function getExistingCurriculum(courseId: string, session?: ClientSession): Promise<ExistingCurriculum> {
  const courseOid = toObjectId(courseId);
  const moduleQuery = Module.find({ course: courseOid }).select("_id title sortOrder").lean();
  const lessonQuery = Lesson.find({ course: courseOid }).select("module title sortOrder").lean();
  if (session) {
    moduleQuery.session(session);
    lessonQuery.session(session);
  }
  const [modules, lessons] = await Promise.all([moduleQuery, lessonQuery]);
  return { modules, lessons };
}

function findExistingModule(existing: ExistingCurriculum, module: ParsedModule) {
  const titleKey = normalizedKey(module.title);
  return (
    existing.modules.find(
      (item) => item.sortOrder === module.order && normalizedKey(item.title) === titleKey
    ) ?? existing.modules.find((item) => normalizedKey(item.title) === titleKey)
  );
}

function isExistingLesson(existing: ExistingCurriculum, moduleId: Types.ObjectId, lesson: ParsedLesson): boolean {
  const titleKey = normalizedKey(lesson.title);
  return existing.lessons.some(
    (item) =>
      String(item.module) === String(moduleId) &&
      ((item.sortOrder === lesson.order && normalizedKey(item.title) === titleKey) ||
        normalizedKey(item.title) === titleKey)
  );
}

export async function previewCurriculumCsv(courseId: string, parsed: ParsedCurriculumCsv): Promise<CurriculumCsvPreview> {
  await connectDB();
  const course = await Course.exists({ _id: toObjectId(courseId) });
  if (!course) throw new Error("Course not found.");
  const existing = await getExistingCurriculum(courseId);
  let duplicateModules = 0;
  let duplicateLessons = 0;

  const modules = parsed.modules.map((module) => {
    const existingModule = findExistingModule(existing, module);
    if (existingModule) duplicateModules += 1;
    if (existingModule) {
      duplicateLessons += module.lessons.filter((lesson) =>
        isExistingLesson(existing, existingModule._id, lesson)
      ).length;
    }
    return {
      order: module.order,
      title: module.title,
      lessonCount: module.lessons.length,
      alreadyExists: Boolean(existingModule),
    };
  });

  return {
    totalRows: parsed.totalRows,
    validRows: parsed.validRows,
    invalidRows: parsed.invalidRows,
    moduleCount: parsed.modules.length,
    lessonCount: parsed.modules.reduce((sum, module) => sum + module.lessons.length, 0),
    duplicateModules,
    duplicateLessons,
    errors: parsed.errors,
    modules,
  };
}

function lessonDocument(courseId: Types.ObjectId, moduleId: Types.ObjectId, lesson: ParsedLesson) {
  const youtube = lesson.type === "youtube" ? normalizeYouTubeUrl(lesson.youtubeUrl) : null;
  return {
    _id: new Types.ObjectId(),
    course: courseId,
    module: moduleId,
    title: lesson.title,
    contentType:
      lesson.type === "youtube"
        ? LESSON_CONTENT_TYPES.VIDEO
        : lesson.type === "pdf"
          ? LESSON_CONTENT_TYPES.PDF
          : LESSON_CONTENT_TYPES.TEXT,
    content:
      lesson.type === "text"
        ? [lesson.description.trim(), lesson.textContent].filter(Boolean).join("\n\n")
        : lesson.description || undefined,
    videoProvider: youtube ? "youtube" : undefined,
    videoUrl: youtube?.watchUrl,
    pdfUrl: lesson.type === "pdf" ? lesson.pdfUrl : undefined,
    durationMinutes: lesson.durationMinutes,
    isPreview: lesson.isPreview,
    isPublished: lesson.isPublished,
    sortOrder: lesson.order,
  };
}

export async function importCurriculumCsv(
  courseId: string,
  parsed: ParsedCurriculumCsv
): Promise<CurriculumCsvImportResult> {
  if (parsed.errors.length > 0 || parsed.invalidRows > 0) {
    throw new Error("Fix every CSV validation error before importing.");
  }
  if (parsed.modules.length === 0) throw new Error("The CSV does not contain any lessons to import.");

  const db = await connectDB();
  const courseOid = toObjectId(courseId);
  const session = await db.startSession();
  let result: CurriculumCsvImportResult = { modulesCreated: 0, lessonsCreated: 0, skipped: 0, failed: 0 };

  try {
    await session.withTransaction(async () => {
      const course = await Course.findById(courseOid).select("_id").session(session).lean();
      if (!course) throw new Error("Course not found.");
      const existing = await getExistingCurriculum(courseId, session);
      const moduleDocuments: Array<Record<string, unknown>> = [];
      const lessonDocuments: Array<Record<string, unknown>> = [];
      let duplicateModules = 0;
      let duplicateLessons = 0;

      for (const parsedModule of parsed.modules) {
        const existingModule = findExistingModule(existing, parsedModule);
        const moduleId = existingModule?._id ?? new Types.ObjectId();
        if (existingModule) {
          duplicateModules += 1;
        } else {
          moduleDocuments.push({
            _id: moduleId,
            course: courseOid,
            title: parsedModule.title,
            description: parsedModule.description || undefined,
            sortOrder: parsedModule.order,
            isPublished: parsedModule.lessons.some((lesson) => lesson.isPublished),
          });
        }

        for (const lesson of parsedModule.lessons) {
          if (existingModule && isExistingLesson(existing, existingModule._id, lesson)) {
            duplicateLessons += 1;
            continue;
          }
          lessonDocuments.push(lessonDocument(courseOid, moduleId, lesson));
        }
      }

      if (moduleDocuments.length > 0) await Module.insertMany(moduleDocuments, { session });
      if (lessonDocuments.length > 0) await Lesson.insertMany(lessonDocuments, { session });
      result = {
        modulesCreated: moduleDocuments.length,
        lessonsCreated: lessonDocuments.length,
        skipped: duplicateModules + duplicateLessons,
        failed: 0,
      };
    });
  } finally {
    await session.endSession();
  }

  return result;
}

export function decodeCurriculumCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new Error("The CSV must be UTF-8 encoded.");
  }
}

