import { z } from "zod";
import { QUIZ_TYPES, type QuizType } from "@/lib/constants";

export const createQuizSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  moduleId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  instructions: z.string().max(4000, "Instructions too long").optional(),
  type: z.enum(Object.values(QUIZ_TYPES) as [QuizType, ...QuizType[]]),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute").max(600, "Duration too long").optional().nullable(),
  passingPercentage: z.number().int().min(0, "Passing percentage cannot be negative").max(100, "Passing percentage cannot exceed 100"),
  maxAttempts: z.number().int().min(1, "Max attempts must be at least 1").optional().nullable(),
  shuffleQuestions: z.boolean().optional().default(false),
  shuffleOptions: z.boolean().optional().default(false),
  showCorrectAnswers: z.boolean().optional().default(true),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.availableFrom && data.availableUntil) {
    return new Date(data.availableUntil) > new Date(data.availableFrom);
  }
  return true;
}, {
  message: "Available until must be after available from",
  path: ["availableUntil"],
});

export const updateQuizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  instructions: z.string().max(4000, "Instructions too long").optional(),
  type: z.enum(Object.values(QUIZ_TYPES) as [QuizType, ...QuizType[]]).optional(),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute").max(600, "Duration too long").optional().nullable(),
  passingPercentage: z.number().int().min(0, "Passing percentage cannot be negative").max(100, "Passing percentage cannot exceed 100").optional(),
  maxAttempts: z.number().int().min(1, "Max attempts must be at least 1").optional().nullable(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
  moduleId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
}).refine((data) => {
  if (data.availableFrom && data.availableUntil) {
    return new Date(data.availableUntil) > new Date(data.availableFrom);
  }
  return true;
}, {
  message: "Available until must be after available from",
  path: ["availableUntil"],
});

export const createQuestionSchema = z.object({
  question: z.string().min(1, "Question is required").max(2000, "Question too long"),
  options: z.array(z.object({
    id: z.string().min(1, "Option ID is required").max(20, "Option ID too long"),
    text: z.string().min(1, "Option text is required").max(1000, "Option text too long"),
  })).min(2, "At least 2 options are required"),
  correctOptionId: z.string().min(1, "Correct option is required"),
  marks: z.number().int().min(1, "Marks must be at least 1"),
  negativeMarks: z.number().int().min(0, "Negative marks cannot be negative").optional().default(0),
  explanation: z.string().max(2000, "Explanation too long").optional(),
  order: z.number().int().min(0, "Order cannot be negative").optional().default(0),
  isPublished: z.boolean().optional().default(true),
}).refine((data) => {
  const optionIds = data.options.map((o) => o.id);
  return optionIds.includes(data.correctOptionId);
}, {
  message: "Correct option ID must match one of the option IDs",
  path: ["correctOptionId"],
}).refine((data) => {
  const optionIds = data.options.map((o) => o.id);
  return new Set(optionIds).size === optionIds.length;
}, {
  message: "Option IDs must be unique",
  path: ["options"],
});

export const updateQuestionSchema = z.object({
  question: z.string().min(1, "Question is required").max(2000, "Question too long").optional(),
  options: z.array(z.object({
    id: z.string().min(1, "Option ID is required").max(20, "Option ID too long"),
    text: z.string().min(1, "Option text is required").max(1000, "Option text too long"),
  })).min(2, "At least 2 options are required").optional(),
  correctOptionId: z.string().min(1, "Correct option is required").optional(),
  marks: z.number().int().min(1, "Marks must be at least 1").optional(),
  negativeMarks: z.number().int().min(0, "Negative marks cannot be negative").optional(),
  explanation: z.string().max(2000, "Explanation too long").optional(),
  order: z.number().int().min(0, "Order cannot be negative").optional(),
  isPublished: z.boolean().optional(),
}).refine((data) => {
  if (data.options && data.correctOptionId) {
    const optionIds = data.options.map((o) => o.id);
    return optionIds.includes(data.correctOptionId);
  }
  return true;
}, {
  message: "Correct option ID must match one of the option IDs",
  path: ["correctOptionId"],
}).refine((data) => {
  if (data.options) {
    const optionIds = data.options.map((o) => o.id);
    return new Set(optionIds).size === optionIds.length;
  }
  return true;
}, {
  message: "Option IDs must be unique",
  path: ["options"],
});

export const reorderQuestionsSchema = z.object({
  questionOrders: z.array(z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  })).min(1),
});

export const quizFiltersSchema = z.object({
  search: z.string().optional(),
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  type: z.enum(["module", "lesson", "final", "all"]).optional().default("all"),
  status: z.enum(["published", "draft", "all"]).optional().default("all"),
  sort: z.enum(["updatedAt", "createdAt", "title", "attemptCount"]).optional().default("updatedAt"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const resultFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["submitted", "expired", "in_progress", "all"]).optional().default("all"),
  sort: z.enum(["submittedAt", "percentage", "score", "studentName"]).optional().default("submittedAt"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;
export type QuizFiltersInput = z.infer<typeof quizFiltersSchema>;
export type ResultFiltersInput = z.infer<typeof resultFiltersSchema>;