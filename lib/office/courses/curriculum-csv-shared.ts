export const CURRICULUM_CSV_HEADERS = [
  "module_order",
  "module_title",
  "module_description",
  "lesson_order",
  "lesson_title",
  "lesson_type",
  "youtube_url",
  "text_content",
  "pdf_url",
  "lesson_description",
  "duration_minutes",
  "is_preview",
  "is_published",
] as const;

export interface CurriculumCsvError {
  row: number;
  message: string;
}

export interface CurriculumCsvPreviewModule {
  order: number;
  title: string;
  lessonCount: number;
  alreadyExists: boolean;
}

export interface CurriculumCsvPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  moduleCount: number;
  lessonCount: number;
  duplicateModules: number;
  duplicateLessons: number;
  errors: CurriculumCsvError[];
  modules: CurriculumCsvPreviewModule[];
}

export interface CurriculumCsvImportResult {
  modulesCreated: number;
  lessonsCreated: number;
  skipped: number;
  failed: number;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

const templateRows = [
  [
    "1",
    "Introduction",
    "Introduction to the course",
    "1",
    "Course Introduction",
    "youtube",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "",
    "",
    "Welcome to the course",
    "15",
    "false",
    "true",
  ],
  [
    "1",
    "Introduction",
    "Introduction to the course",
    "2",
    "What you will learn",
    "text",
    "",
    "This lesson supports commas, quoted text, and multiline content.",
    "",
    "Course overview",
    "10",
    "false",
    "true",
  ],
  [
    "2",
    "Course Notes",
    "Downloadable reading material",
    "1",
    "Course handbook",
    "pdf",
    "",
    "",
    "https://example.com/course-handbook.pdf",
    "Read the handbook before continuing",
    "5",
    "false",
    "true",
  ],
];

export const CURRICULUM_CSV_TEMPLATE = [
  CURRICULUM_CSV_HEADERS.join(","),
  ...templateRows.map((row) => row.map(csvCell).join(",")),
].join("\r\n");

