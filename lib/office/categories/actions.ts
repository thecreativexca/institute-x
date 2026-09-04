"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";

import { recordAuditEvent } from "@/lib/audit/log";
import { getValidatedSession } from "@/lib/auth/helpers";
import { PERMISSIONS } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { requirePermission } from "@/lib/office/courses/permissions";
import { slugify } from "@/lib/office/courses/validation";
import { Category } from "@/models/Category";
import { Course } from "@/models/Course";
import type { CategoryActionResult, CategoryFormInput } from "./dto";
import { categoryFormSchema, type ValidatedCategoryInput } from "./validation";

async function requireCategoryAdmin() {
  const { user } = await getValidatedSession();
  return requirePermission(user, PERMISSIONS.COURSES_UPDATE);
}

function fieldsFromZod(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] ??= issue.message;
  }
  return fields;
}

function safeMessage(error: unknown): string {
  console.error("Category action failed:", error);
  return "Something went wrong while saving the category. Please try again.";
}

function revalidateCategories(slug?: string) {
  revalidatePath("/office/categories");
  revalidatePath("/office/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  if (slug) revalidatePath(`/courses?category=${slug}`);
}

function normalize(data: ValidatedCategoryInput) {
  return {
    name: data.name,
    slug: data.slug || slugify(data.name) || "category",
    description: data.description || undefined,
    thumbnailUrl: data.thumbnailUrl || undefined,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
    seoTitle: data.seoTitle || undefined,
    seoDescription: data.seoDescription || undefined,
  };
}

async function duplicateFields(name: string, slug: string, excludeId?: string) {
  const exclude = excludeId ? { $ne: new Types.ObjectId(excludeId) } : undefined;
  const [nameMatch, slugMatch] = await Promise.all([
    Category.findOne({
      ...(exclude ? { _id: exclude } : {}),
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    })
      .select("_id")
      .lean(),
    Category.findOne({ ...(exclude ? { _id: exclude } : {}), slug }).select("_id").lean(),
  ]);
  return { name: Boolean(nameMatch), slug: Boolean(slugMatch) };
}

export async function createCategoryAdminAction(
  input: CategoryFormInput
): Promise<CategoryActionResult> {
  try {
    const user = await requireCategoryAdmin();
    const parsed = categoryFormSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldsFromZod(parsed.error) };

    await connectDB();
    const data = normalize(parsed.data);
    const duplicates = await duplicateFields(data.name, data.slug);
    const fieldErrors: Record<string, string> = {};
    if (duplicates.name) fieldErrors.name = "A category with this name already exists.";
    if (duplicates.slug) fieldErrors.slug = "This slug is already in use.";
    if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

    const category = await Category.create(data);
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "category.create",
      entityType: "category",
      entityId: category._id.toString(),
      metadata: { name: category.name, slug: category.slug },
    });
    revalidateCategories(category.slug);
    return {
      ok: true,
      message: "Category created.",
      category: { id: category._id.toString(), name: category.name },
    };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

/** Compatibility action used by the inline picker in Course Builder. */
export async function createCategoryAction(input: {
  name: string;
}): Promise<CategoryActionResult> {
  try {
    const user = await requireCategoryAdmin();
    const name = input.name.trim();
    if (!name || name.length > 120) {
      return { ok: false, fieldErrors: { name: "Enter a category name up to 120 characters." } };
    }
    await connectDB();
    const existing = await Category.findOne({
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    })
      .select("name")
      .lean();
    if (existing) {
      return {
        ok: true,
        reused: true,
        category: { id: existing._id.toString(), name: existing.name },
      };
    }

    const baseSlug = slugify(name) || "category";
    let slug = baseSlug;
    let suffix = 2;
    while (await Category.exists({ slug })) slug = `${baseSlug}-${suffix++}`;
    const category = await Category.create({ name, slug, isActive: true, sortOrder: 0 });
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "category.create",
      entityType: "category",
      entityId: category._id.toString(),
      metadata: { name, slug, source: "course_builder" },
    });
    revalidateCategories(slug);
    return { ok: true, category: { id: category._id.toString(), name: category.name } };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: CategoryFormInput
): Promise<CategoryActionResult> {
  try {
    const user = await requireCategoryAdmin();
    if (!Types.ObjectId.isValid(categoryId)) return { ok: false, error: "Invalid category." };
    const parsed = categoryFormSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: fieldsFromZod(parsed.error) };

    await connectDB();
    const category = await Category.findById(categoryId);
    if (!category) return { ok: false, error: "Category not found." };

    const data = normalize(parsed.data);
    const duplicates = await duplicateFields(data.name, data.slug, categoryId);
    const fieldErrors: Record<string, string> = {};
    if (duplicates.name) fieldErrors.name = "A category with this name already exists.";
    if (duplicates.slug) fieldErrors.slug = "This slug is already in use.";
    if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

    const previousSlug = category.slug;
    Object.assign(category, data);
    await category.save();
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "category.update",
      entityType: "category",
      entityId: categoryId,
      metadata: { name: category.name, slug: category.slug },
    });
    revalidateCategories(previousSlug);
    revalidateCategories(category.slug);
    return { ok: true, message: "Category updated." };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

export async function setCategoryStatusAction(
  categoryId: string,
  isActive: boolean
): Promise<CategoryActionResult> {
  try {
    const user = await requireCategoryAdmin();
    if (!Types.ObjectId.isValid(categoryId)) return { ok: false, error: "Invalid category." };
    await connectDB();
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: { isActive } },
      { new: true }
    );
    if (!category) return { ok: false, error: "Category not found." };
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "category.update",
      entityType: "category",
      entityId: categoryId,
      metadata: { isActive },
    });
    revalidateCategories(category.slug);
    return { ok: true, message: isActive ? "Category activated." : "Category deactivated." };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<CategoryActionResult> {
  try {
    const user = await requireCategoryAdmin();
    if (!Types.ObjectId.isValid(categoryId)) return { ok: false, error: "Invalid category." };
    await connectDB();
    const category = await Category.findById(categoryId).select("name slug").lean();
    if (!category) return { ok: false, error: "Category not found." };
    const courseCount = await Course.countDocuments({ category: category._id });
    if (courseCount > 0) {
      return {
        ok: false,
        error: `This category is used by ${courseCount} course${courseCount === 1 ? "" : "s"}. Move those courses before deleting it.`,
      };
    }
    await Category.deleteOne({ _id: category._id });
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "category.delete",
      entityType: "category",
      entityId: categoryId,
      metadata: { name: category.name, slug: category.slug },
    });
    revalidateCategories(category.slug);
    return { ok: true, message: "Category deleted." };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
