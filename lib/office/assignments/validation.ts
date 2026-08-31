import { z } from "zod";

export const createAssignmentSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  moduleId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  instructions: z.string().min(1, "Instructions are required"),
  dueAt: z.string().datetime().optional().nullable(),
  maxScore: z.number().int().min(1, "Max score must be at least 1").max(10000, "Max score too high"),
  isPublished: z.boolean().optional().default(false),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  instructions: z.string().min(1, "Instructions are required").optional(),
  dueAt: z.string().datetime().optional().nullable(),
  maxScore: z.number().int().min(1, "Max score must be at least 1").max(10000, "Max score too high").optional(),
  moduleId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const gradeSubmissionSchema = z.object({
  score: z.number().int().min(0, "Score cannot be negative"),
  feedback: z.string().min(1, "Feedback is required").max(5000, "Feedback too long"),
  internalNote: z.string().max(2000, "Internal note too long").optional(),
  status: z.enum(["graded", "returned_for_resubmission"]).optional().default("graded"),
});

export const assignmentFiltersSchema = z.object({
  search: z.string().optional(),
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  status: z.enum(["published", "draft", "all"]).optional().default("all"),
  deadlineFilter: z.enum(["upcoming", "passed", "all"]).optional().default("all"),
  hasPendingSubmissions: z.boolean().optional(),
  sort: z.enum(["updatedAt", "dueAt", "createdAt", "title"]).optional().default("updatedAt"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const submissionFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["pending_review", "graded", "late", "returned", "all"]).optional().default("all"),
  sort: z.enum(["submittedAt", "studentName", "status", "score"]).optional().default("submittedAt"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type AssignmentFiltersInput = z.infer<typeof assignmentFiltersSchema>;
export type SubmissionFiltersInput = z.infer<typeof submissionFiltersSchema>;