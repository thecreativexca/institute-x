import { z } from "zod";
import { AUDIENCES, type Audience } from "@/lib/constants";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  body: z.string().min(1, "Body is required"),
  audience: z.enum(Object.values(AUDIENCES) as [Audience, ...Audience[]]),
  courseId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sendEmail: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.audience === AUDIENCES.STUDENTS && !data.courseId) {
    return false;
  }
  return true;
}, {
  message: "Course is required when audience is 'Course Students'",
  path: ["courseId"],
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  body: z.string().min(1, "Body is required").optional(),
  audience: z.enum(Object.values(AUDIENCES) as [Audience, ...Audience[]]).optional(),
  courseId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sendEmail: z.boolean().optional(),
}).refine((data) => {
  if (data.audience === AUDIENCES.STUDENTS && !data.courseId) {
    return false;
  }
  return true;
}, {
  message: "Course is required when audience is 'Course Students'",
  path: ["courseId"],
});

export const announcementFiltersSchema = z.object({
  search: z.string().optional(),
  audience: z.enum(["all", "students", "staff"]).optional().default("all"),
  status: z.enum(["active", "inactive", "all"]).optional().default("all"),
  sort: z.enum(["updatedAt", "publishedAt", "createdAt", "title"]).optional().default("updatedAt"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type AnnouncementFiltersInput = z.infer<typeof announcementFiltersSchema>;