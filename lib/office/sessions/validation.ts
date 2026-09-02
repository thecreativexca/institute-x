import { z } from "zod";
import { SESSION_STATUSES, type SessionStatus } from "@/lib/constants";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const sessionFormSchema = z.object({
  courseId: z
    .string()
    .min(1, "Select a course.")
    .regex(/^[0-9a-fA-F]{24}$/, "Select a valid course."),
  title: z.string().trim().min(1, "Title is required.").max(200, "Keep the title under 200 characters."),
  date: z.string().regex(DATE_RE, "Choose a valid date."),
  startTime: z
    .string()
    .regex(TIME_RE, "Start time must look like 09:30.")
    .optional()
    .or(z.literal("")),
  endTime: z
    .string()
    .regex(TIME_RE, "End time must look like 11:30.")
    .optional()
    .or(z.literal("")),
  venue: z.string().trim().min(1, "Venue is required.").max(200, "Keep the venue under 200 characters."),
  address: z.string().trim().max(300, "Keep the address under 300 characters.").optional(),
  instructorName: z.string().trim().max(120, "Keep the instructor name short.").optional(),
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters.").optional(),
  status: z
    .enum(Object.values(SESSION_STATUSES) as [SessionStatus, ...SessionStatus[]])
    .default(SESSION_STATUSES.SCHEDULED),
  isDisplayed: z.boolean().default(true),
});

export type SessionFormInput = z.infer<typeof sessionFormSchema>;

export function sessionFormToDate(dateKey: string): Date {
  // Local noon keeps the calendar day stable across timezones.
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
