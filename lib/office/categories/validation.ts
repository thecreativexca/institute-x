import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(1000, "Image URL is too long.")
  .refine(
    (value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value),
    "Use a valid http(s) URL or a site-relative path."
  )
  .default("");

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500).default(""),
  thumbnailUrl: optionalUrl,
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  seoTitle: z.string().trim().max(200).default(""),
  seoDescription: z.string().trim().max(300).default(""),
});

export type ValidatedCategoryInput = z.infer<typeof categoryFormSchema>;
