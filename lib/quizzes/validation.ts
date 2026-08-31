import { z } from "zod";

import { objectIdSchema } from "@/lib/validations/common";

/** Parsed route params for single-param quiz routes. */
export const quizIdParamSchema = z.object({ quizId: objectIdSchema });

/** Parsed route params for attempt routes. */
export const attemptParamsSchema = z.object({
  quizId: objectIdSchema,
  attemptId: objectIdSchema,
});

/** Body for saving an answer during an active attempt. */
export const saveAnswerSchema = z.object({
  attemptId: objectIdSchema,
  questionId: objectIdSchema,
  selectedOptionId: z.string().trim().min(1).max(20),
});

/** Body for submitting an attempt. */
export const submitAttemptSchema = z.object({
  reason: z.enum(["manual", "expired"]).optional().default("manual"),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
