"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getValidatedSession } from "@/lib/auth/helpers";
import type { SessionUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { COURSE_STATUSES } from "@/lib/constants";
import { Category } from "@/models/Category";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { Resource } from "@/models/Resource";
import { Enrollment } from "@/models/Enrollment";
import { Payment } from "@/models/Payment";
import { Progress } from "@/models/Progress";
import { Certificate } from "@/models/Certificate";
import { recordAuditEvent } from "@/lib/audit/log";
import {
  PermissionDeniedError,
  requirePermission,
  requireCourseScope,
  COURSE_PERMISSIONS,
} from "./permissions";
import {
  courseFormSchema,
  validateCoursePricing,
  slugify,
  createModuleSchema,
  updateModuleSchema,
  createLessonSchema,
  updateLessonSchema,
} from "./validation";
import { normalizeYouTubeUrl } from "./youtube";
import type { CategoryCreateResult } from "./dto";
import { getCoursePublishReadiness } from "./publish-readiness";
import { applyReorder } from "./ordering";

/**
 * Phase 17 server actions — the ONLY mutation entry point for office course
 * content. Every action:
 *   1. re-reads the session server-side (never trusts client role/ids)
 *   2. re-checks permission + course scope (hidden buttons are not security)
 *   3. validates ownership relationships (Course → Module → Lesson → Resource)
 *   4. allowlists fields (mass-assignment protection, req. 102)
 *   5. records a concise audit event (req. 93–94)
 */

export interface ActionState {
  ok: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function toMessage(error: unknown): string {
  if (error instanceof PermissionDeniedError) return error.message;
  if (error instanceof z.ZodError) return "Please review the highlighted fields.";
  console.error("Course action failed:", error);
  return "Something went wrong. Please try again.";
}

async function requireSession(): Promise<SessionUser> {
  const { user } = await getValidatedSession();
  if (!user) throw new PermissionDeniedError("Please sign in to continue.");
  return user;
}

async function audit(
  user: SessionUser,
  action: Parameters<typeof recordAuditEvent>[0]["action"],
  entityType: Parameters<typeof recordAuditEvent>[0]["entityType"],
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await recordAuditEvent({
    actorUserId: user.id,
    actorRole: user.role,
    action,
    entityType,
    entityId,
    metadata,
  });
}

function revalidateCourse(courseId?: string, slug?: string): void {
  revalidatePath("/office/courses");
  revalidatePath("/courses");
  if (courseId) {
    revalidatePath(`/office/courses/${courseId}`);
    revalidatePath(`/office/courses/${courseId}/edit`);
    revalidatePath(`/office/courses/${courseId}/curriculum`);
  }
  if (slug) revalidatePath(`/courses/${slug}`);
}

/* ------------------------------ Course CRUD ------------------------------- */

function parseCourseForm(formData: FormData) {
  const list = (key: string): string[] => {
    const raw = formData.get(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
    } catch {
      return String(raw)
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
    }
  };

  let faqs: Array<{ question: string; answer: string; enabled: boolean }> = [];
  const faqsRaw = formData.get("faqs");
  if (faqsRaw) {
    try {
      const parsed = JSON.parse(String(faqsRaw));
      if (Array.isArray(parsed)) {
        faqs = parsed.map((f) => ({
          question: String(f.question ?? "").trim(),
          answer: String(f.answer ?? "").trim(),
          enabled: Boolean(f.enabled),
        }));
      }
    } catch {
      faqs = []; // schema validation reports if this was meant to be data
    }
  }

  const value = (key: string) => {
    const raw = formData.get(key);
    return raw === null ? undefined : String(raw);
  };
  const checkbox = (key: string) =>
    formData.get(key) === "on" || formData.get(key) === "true";

  return courseFormSchema.safeParse({
    name: value("name") ?? "",
    slug: value("slug") ?? "",
    categoryId: value("categoryId") ?? "",
    shortDescription: value("shortDescription") ?? "",
    description: value("description") ?? "",
    level: value("level") ?? undefined,
    learningMode: value("learningMode") ?? undefined,
    durationWeeks: value("durationWeeks") || undefined,
    isFree: checkbox("isFree"),
    isPurchasable: checkbox("isPurchasable"),
    price: value("price") || 0,
    compareAtPrice: value("compareAtPrice") || undefined,
    instructorName: value("instructorName") ?? "",
    tags: list("tags"),
    learningOutcomes: list("learningOutcomes"),
    requirements: list("requirements"),
    targetAudience: list("targetAudience"),
    faqs,
    seoTitle: value("seoTitle") ?? "",
    seoDescription: value("seoDescription") ?? "",
  });
}

export async function createCourseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let newCourseId = "";
  try {
    const user = requirePermission(await requireSession(), COURSE_PERMISSIONS.CREATE);

    const parsed = parseCourseForm(formData);
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
    }
    const data = parsed.data;

    const pricingError = validateCoursePricing(data);
    if (pricingError) return { ok: false, error: pricingError };

    await connectDB();

    const slug = data.slug || slugify(data.name);
    const existing = await Course.findOne({ slug }).select("_id").lean();
    if (existing) {
      return {
        ok: false,
        fieldErrors: { slug: "This slug is already used by another course." },
      };
    }

    const course = await Course.create({
      ...data,
      slug,
      status: COURSE_STATUSES.DRAFT,
      price: data.isFree ? 0 : data.price,
      compareAtPrice: data.isFree ? undefined : data.compareAtPrice,
      createdBy: toObjectId(user.id),
      updatedBy: toObjectId(user.id),
    });
    newCourseId = course._id.toString();

    await audit(user, "course.create", "course", newCourseId, {
      title: course.name,
      slug: course.slug,
    });

    revalidateCourse(newCourseId, course.slug);
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }

  // redirect() throws internally, so it stays outside the try block.
  redirect(`/office/courses/${newCourseId}`);
}

export async function updateCourseAction(
  courseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(
      await requireSession(),
      COURSE_PERMISSIONS.UPDATE,
      courseId
    );

    const parsed = parseCourseForm(formData);
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
    }
    const data = parsed.data;

    const pricingError = validateCoursePricing(data);
    if (pricingError) return { ok: false, error: pricingError };

    await connectDB();

    const course = await Course.findById(toObjectId(courseId));
    if (!course) return { ok: false, error: "Course not found." };

    const previousSlug = course.slug;

    // Slug uniqueness (req. 14): never silently overwrite another course.
    if (data.slug !== course.slug) {
      const clash = await Course.findOne({ slug: data.slug }).select("_id").lean();
      if (clash) {
        return {
          ok: false,
          fieldErrors: { slug: "This slug is already used by another course." },
        };
      }
    }

    // Allowlisted fields only (req. 22/102). Internal ids, enrollment data,
    // payment records and progress are never touchable from this form.
    course.name = data.name;
    course.slug = data.slug;
    course.category = toObjectId(data.categoryId);
    course.shortDescription = data.shortDescription || undefined;
    course.description = data.description || undefined;
    course.level = data.level;
    course.learningMode = data.learningMode;
    course.durationWeeks = data.durationWeeks;
    course.isFree = data.isFree;
    course.isPurchasable = data.isPurchasable;
    course.price = data.isFree ? 0 : data.price;
    course.compareAtPrice = data.isFree ? undefined : data.compareAtPrice;
    course.instructorName = data.instructorName || undefined;
    course.tags = data.tags;
    course.learningOutcomes = data.learningOutcomes;
    course.requirements = data.requirements;
    course.targetAudience = data.targetAudience;
    course.faqs = data.faqs;
    course.seoTitle = data.seoTitle || undefined;
    course.seoDescription = data.seoDescription || undefined;
    course.updatedBy = toObjectId(user.id);

    await course.save();

    await audit(user, "course.update", "course", courseId, {
      title: course.name,
      oldStatus: course.status,
    });

    revalidateCourse(courseId, course.slug);
    if (previousSlug !== course.slug) revalidatePath(`/courses/${previousSlug}`);

    return {
      ok: true,
      message:
        previousSlug !== course.slug && course.status === COURSE_STATUSES.PUBLISHED
          ? "Saved. Note: the course URL changed — old links may need a redirect."
          : "Course saved.",
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/* ------------------------------- Categories ------------------------------- */

/**
 * Quick-create a category from the course form (inline action, req. 87).
 * If a category with the same name already exists it is reused (returned)
 * rather than creating a duplicate. Permission gate mirrors course creation.
 */
export async function createCategoryAction(input: {
  name: string;
}): Promise<CategoryCreateResult> {
  try {
    const user = requirePermission(await requireSession(), COURSE_PERMISSIONS.CREATE);

    const parsed = z
      .object({
        name: z
          .string()
          .trim()
          .min(1, "Please enter a category name.")
          .max(120, "Category name is too long (max 120 characters)."),
      })
      .safeParse(input);
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
    }
    const name = parsed.data.name;

    await connectDB();

    // Reuse an existing category (case-insensitive) instead of duplicating.
    const existing = await Category.findOne({
      name: { $regex: `^${escapeRegexForCategory(name)}$`, $options: "i" },
    })
      .select("name")
      .lean();
    if (existing) {
      return {
        ok: true,
        reused: true,
        category: { id: existing._id.toString(), name: existing.name || name },
      };
    }

    let slug = slugify(name) || "category";
    if (await Category.exists({ slug })) {
      // Name is free but its slug is taken — disambiguate with a suffix.
      let counter = 2;
      while (await Category.exists({ slug: `${slug}-${counter}` })) counter += 1;
      slug = `${slug}-${counter}`;
    }

    const category = await Category.create({ name, slug, sortOrder: 0 });

    await audit(user, "category.create", "category", category._id.toString(), {
      title: category.name,
      slug: category.slug,
    });

    revalidatePath("/office/courses");

    return {
      ok: true,
      category: { id: category._id.toString(), name: category.name },
    };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

function escapeRegexForCategory(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* --------------------------- Status transitions --------------------------- */

async function setCourseStatus(
  courseId: string,
  permission: (typeof COURSE_PERMISSIONS)[keyof typeof COURSE_PERMISSIONS],
  status: (typeof COURSE_STATUSES)[keyof typeof COURSE_STATUSES],
  auditAction: Parameters<typeof recordAuditEvent>[0]["action"],
  extraMessage?: string
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(await requireSession(), permission, courseId);
    await connectDB();

    if (status === COURSE_STATUSES.PUBLISHED) {
      const readiness = await getCoursePublishReadiness(courseId);
      if (!readiness.ready) {
        return {
          ok: false,
          error: `Not ready to publish: ${readiness.blockingIssues.join(" ")}`,
        };
      }
    }

    const course = await Course.findByIdAndUpdate(
      toObjectId(courseId),
      { $set: { status, updatedBy: toObjectId(user.id) } },
      { new: true }
    );
    if (!course) return { ok: false, error: "Course not found." };

    await audit(user, auditAction, "course", courseId, {
      title: course.name,
      newStatus: status,
    });
    revalidateCourse(courseId, course.slug);
    return { ok: true, message: extraMessage ?? `Course is now ${status}.` };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function publishCourseAction(courseId: string): Promise<ActionState> {
  return setCourseStatus(
    courseId,
    COURSE_PERMISSIONS.PUBLISH,
    COURSE_STATUSES.PUBLISHED,
    "course.publish",
    "Course published. It may now be visible to students and public visitors."
  );
}

export async function unpublishCourseAction(courseId: string): Promise<ActionState> {
  return setCourseStatus(
    courseId,
    COURSE_PERMISSIONS.PUBLISH,
    COURSE_STATUSES.DRAFT,
    "course.unpublish",
    "Course moved to draft. Public discovery is off; existing enrolled students keep their access."
  );
}

export async function archiveCourseAction(courseId: string): Promise<ActionState> {
  return setCourseStatus(
    courseId,
    COURSE_PERMISSIONS.PUBLISH,
    COURSE_STATUSES.ARCHIVED,
    "course.archive",
    "Course archived. Hidden from new students; historical records preserved."
  );
}

export async function restoreCourseToDraftAction(courseId: string): Promise<ActionState> {
  return setCourseStatus(
    courseId,
    COURSE_PERMISSIONS.UPDATE,
    COURSE_STATUSES.DRAFT,
    "course.update",
    "Course restored to draft. Run publish (with readiness check) when ready."
  );
}

/** Hard delete only for an unused draft course (req. 71–72). */
export async function deleteCourseAction(courseId: string): Promise<ActionState> {
  try {
    const user = await requireCourseScope(
      await requireSession(),
      COURSE_PERMISSIONS.UPDATE,
      courseId
    );
    await connectDB();

    const courseOid = toObjectId(courseId);
    const course = await Course.findById(courseOid).select("name status").lean();
    if (!course) return { ok: false, error: "Course not found." };

    if (course.status !== COURSE_STATUSES.DRAFT) {
      return {
        ok: false,
        error: "Only draft courses can be deleted. Archive the course instead.",
      };
    }

    const [enrollments, payments, progress, certificates] = await Promise.all([
      Enrollment.countDocuments({ course: courseOid }),
      Payment.countDocuments({ course: courseOid }),
      Progress.countDocuments({ course: courseOid }),
      Certificate.countDocuments({ course: courseOid }),
    ]);

    if (enrollments + payments + progress + certificates > 0) {
      return {
        ok: false,
        error:
          "This course has historical student or payment records and cannot be deleted. Archive it instead.",
      };
    }

    await Resource.deleteMany({ course: courseOid });
    await Lesson.deleteMany({ course: courseOid });
    await Module.deleteMany({ course: courseOid });
    await Course.findByIdAndDelete(courseOid);

    await audit(user, "course.delete", "course", courseId, { title: course.name });
    revalidateCourse();
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }

  redirect("/office/courses");
}

/* -------------------------------- Modules --------------------------------- */

function revalidateCurriculum(courseId: string): void {
  revalidatePath(`/office/courses/${courseId}/curriculum`);
  revalidatePath(`/office/courses/${courseId}`);
  revalidatePath("/student/courses");
}

export async function createModuleAction(
  courseId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.MODULES, courseId);

    const parsed = createModuleSchema.safeParse({
      courseId,
      title: formData.get("title") ?? "",
      description: formData.get("description") ?? "",
      isPublished: formData.get("isPublished") === "true",
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
    }

    await connectDB();

    const course = await Course.findById(toObjectId(courseId)).select("_id").lean();
    if (!course) return { ok: false, error: "Course not found." };

    // Server assigns a safe order (req. 33–34): last position.
    const last = await Module.findOne({ course: course._id })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();
    const nextOrder = ((last?.sortOrder as number) ?? 0) + 1;

    const moduleDoc = await Module.create({
      course: course._id,
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      isPublished: parsed.data.isPublished,
      sortOrder: nextOrder,
    });

    await audit(user, "module.create", "module", moduleDoc._id.toString(), {
      title: moduleDoc.title,
      courseId,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Module created." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function updateModuleAction(
  courseId: string,
  moduleId: string,
  changes: { title?: string; description?: string; isPublished?: boolean }
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.MODULES, courseId);
    await connectDB();

    const parsed = updateModuleSchema.safeParse(changes);
    if (!parsed.success) {
      return { ok: false, error: "Invalid moduleDoc changes." };
    }

    // IDOR (req. 101): the moduleDoc MUST belong to the course in the URL.
    const moduleDoc = await Module.findOne({
      _id: toObjectId(moduleId),
      course: toObjectId(courseId),
    });
    if (!moduleDoc) return { ok: false, error: "Module not found in this course." };

    if (parsed.data.title !== undefined) moduleDoc.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      moduleDoc.description = parsed.data.description || undefined;
    if (parsed.data.isPublished !== undefined)
      moduleDoc.isPublished = parsed.data.isPublished;
    await moduleDoc.save();

    await audit(user, "module.update", "module", moduleId, {
      title: moduleDoc.title,
      courseId,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Module updated." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/**
 * Delete is careful (req. 38–39): a moduleDoc with lessons (or any student
 * progress) is never hard-deleted — the caller is told to unpublish/archive.
 */
export async function deleteModuleAction(
  courseId: string,
  moduleId: string
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.MODULES, courseId);
    await connectDB();

    const moduleDoc = await Module.findOne({
      _id: toObjectId(moduleId),
      course: toObjectId(courseId),
    });
    if (!moduleDoc) return { ok: false, error: "Module not found in this course." };

    const lessonCount = await Lesson.countDocuments({ module: moduleDoc._id });
    if (lessonCount > 0) {
      return {
        ok: false,
        error: `This moduleDoc contains ${lessonCount} lesson(s) and may have student progress. Remove its lessons or unpublish the moduleDoc instead.`,
      };
    }

    await Module.findByIdAndDelete(moduleDoc._id);
    await audit(user, "module.delete", "module", moduleId, {
      title: moduleDoc.title,
      courseId,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Module deleted." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/**
 * Reorder persisted server-side (req. 35–36). The ordered id list is sent by
 * the client, but EVERY id is verified to belong to the course and to be the
 * complete moduleDoc set before any write (optimistic UI rolls back on failure).
 */
export async function reorderModulesAction(
  courseId: string,
  orderedIds: string[]
): Promise<ActionState> {
  try {
    await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.MODULES, courseId);
    await connectDB();

    const modules = await Module.find({ course: toObjectId(courseId) })
      .select("_id")
      .lean();
    const existing = new Set(modules.map((m) => m._id.toString()));
    if (
      orderedIds.length !== modules.length ||
      !orderedIds.every((id) => existing.has(id))
    ) {
      return { ok: false, error: "Module order is out of date. Refresh and try again." };
    }

    await applyReorder({
      collection: Module,
      filter: { course: toObjectId(courseId) },
      orderedIds,
    });

    await audit(
      (await requireSession()),
      "module.reorder",
      "module",
      courseId,
      { courseId, count: orderedIds.length }
    );
    revalidateCurriculum(courseId);
    return { ok: true, message: "Module order saved." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}


/* -------------------------------- Lessons --------------------------------- */

export async function createLessonAction(
  courseId: string,
  moduleId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.LESSONS, courseId);

    const parsed = createLessonSchema.safeParse({
      moduleId,
      title: formData.get("title") ?? "",
      description: formData.get("description") ?? "",
      youtubeUrl: formData.get("youtubeUrl") ?? "",
      durationMinutes: formData.get("durationMinutes") || undefined,
      isPreview: formData.get("isPreview") === "true",
      isPublished: formData.get("isPublished") === "true",
    });
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
    }
    const data = parsed.data;

    await connectDB();

    // Relationship validation (req. 41–42): the moduleDoc must belong to the
    // course; the lesson's course is derived server-side, never from input.
    const moduleDoc = await Module.findOne({
      _id: toObjectId(data.moduleId),
      course: toObjectId(courseId),
    }).lean();
    if (!moduleDoc) {
      return { ok: false, error: "Module not found in this course." };
    }

    const last = await Lesson.findOne({ module: moduleDoc._id })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();
    const nextOrder = ((last?.sortOrder as number) ?? 0) + 1;

    const video = data.youtubeUrl ? normalizeYouTubeUrl(data.youtubeUrl) : null;
    const lesson = await Lesson.create({
      course: moduleDoc.course,
      module: moduleDoc._id,
      title: data.title,
      content: data.description || undefined,
      videoProvider: video ? "youtube" : undefined,
      videoUrl: video ? video.watchUrl : undefined,
      durationMinutes: data.durationMinutes,
      isPreview: data.isPreview,
      isPublished: data.isPublished,
      sortOrder: nextOrder,
    });

    await audit(user, "lesson.create", "lesson", lesson._id.toString(), {
      title: lesson.title,
      courseId,
      moduleId,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Lesson created." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}


export async function updateLessonAction(
  courseId: string,
  lessonId: string,
  changes: {
    title?: string;
    description?: string;
    youtubeUrl?: string;
    durationMinutes?: number;
    isPreview?: boolean;
    isPublished?: boolean;
  }
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.LESSONS, courseId);
    await connectDB();

    const parsed = updateLessonSchema.safeParse(changes);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid lesson changes.",
      };
    }

    // IDOR: lesson must belong to a module of THIS course.
    const lesson = await Lesson.findOne({
      _id: toObjectId(lessonId),
      course: toObjectId(courseId),
    });
    if (!lesson) return { ok: false, error: "Lesson not found in this course." };

    if (parsed.data.title !== undefined) lesson.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      lesson.content = parsed.data.description || undefined;
    if (parsed.data.youtubeUrl !== undefined) {
      if (!parsed.data.youtubeUrl) {
        lesson.videoUrl = undefined;
        lesson.videoProvider = undefined;
      } else {
        const video = normalizeYouTubeUrl(parsed.data.youtubeUrl);
        if (!video) {
          return {
            ok: false,
            error: "Please enter a valid YouTube URL (youtube.com/watch, youtu.be or embed).",
          };
        }
        lesson.videoProvider = "youtube";
        lesson.videoUrl = video.watchUrl;
      }
    }
    if (parsed.data.durationMinutes !== undefined)
      lesson.durationMinutes = parsed.data.durationMinutes;
    if (parsed.data.isPreview !== undefined) lesson.isPreview = parsed.data.isPreview;
    if (parsed.data.isPublished !== undefined)
      lesson.isPublished = parsed.data.isPublished;
    await lesson.save();

    await audit(user, "lesson.update", "lesson", lessonId, {
      title: lesson.title,
      courseId,
      moduleId: String(lesson.module),
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Lesson updated." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}


/** Lesson delete (req. 53): progress keeps history valid; drafts clean up. */
export async function deleteLessonAction(
  courseId: string,
  lessonId: string
): Promise<ActionState> {
  try {
    const user = await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.LESSONS, courseId);
    await connectDB();

    const lesson = await Lesson.findOne({
      _id: toObjectId(lessonId),
      course: toObjectId(courseId),
    });
    if (!lesson) return { ok: false, error: "Lesson not found in this course." };

    const progressCount = await Progress.countDocuments({ lesson: lesson._id });
    if (progressCount > 0) {
      return {
        ok: false,
        error: `${progressCount} student progress record(s) reference this lesson. Unpublish it instead of deleting.`,
      };
    }

    // Best-effort Cloudinary cleanup; failures are logged for maintenance.
    const resources = await Resource.find({ lesson: lesson._id })
      .select("publicId")
      .lean();
    const { deleteResourceAsset } = await import("@/lib/resources/cloudinary");
    for (const resource of resources) {
      const deleted = await deleteResourceAsset(resource.publicId);
      if (!deleted) {
        console.error("Orphaned Cloudinary asset after lesson delete:", resource.publicId);
      }
    }
    await Resource.deleteMany({ lesson: lesson._id });
    await Lesson.findByIdAndDelete(lesson._id);

    await audit(user, "lesson.delete", "lesson", lessonId, {
      title: lesson.title,
      courseId,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Lesson deleted." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/** Reorder lessons inside a module (server-verified, req. 51). */
export async function reorderLessonsAction(
  courseId: string,
  moduleId: string,
  orderedIds: string[]
): Promise<ActionState> {
  try {
    await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.LESSONS, courseId);
    await connectDB();

    const moduleDoc = await Module.findOne({
      _id: toObjectId(moduleId),
      course: toObjectId(courseId),
    })
      .select("_id")
      .lean();
    if (!moduleDoc) return { ok: false, error: "Module not found in this course." };

    const lessons = await Lesson.find({ module: toObjectId(moduleId) })
      .select("_id")
      .lean();
    const existing = new Set(lessons.map((l) => l._id.toString()));
    if (
      orderedIds.length !== lessons.length ||
      !orderedIds.every((id) => existing.has(id))
    ) {
      return { ok: false, error: "Lesson order is out of date. Refresh and try again." };
    }

    await applyReorder({
      collection: Lesson,
      filter: { module: toObjectId(moduleId) },
      orderedIds,
    });

    await audit(await requireSession(), "lesson.reorder", "lesson", moduleId, {
      courseId,
      moduleId,
      count: orderedIds.length,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Lesson order saved." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}


/** Move a lesson to another module in the SAME course (req. 52). */
export async function moveLessonToModuleAction(
  courseId: string,
  lessonId: string,
  targetModuleId: string
): Promise<ActionState> {
  try {
    await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.LESSONS, courseId);
    await connectDB();

    const [lesson, targetModule] = await Promise.all([
      Lesson.findOne({ _id: toObjectId(lessonId), course: toObjectId(courseId) }),
      Module.findOne({ _id: toObjectId(targetModuleId), course: toObjectId(courseId) })
        .select("_id")
        .lean(),
    ]);
    if (!lesson) return { ok: false, error: "Lesson not found in this course." };
    if (!targetModule) return { ok: false, error: "Target module not found in this course." };
    if (String(lesson.module) === String(targetModule._id)) {
      return { ok: true, message: "Lesson is already in that module." };
    }

    const last = await Lesson.findOne({ module: targetModule._id })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();
    lesson.module = targetModule._id;
    lesson.sortOrder = ((last?.sortOrder as number) ?? 0) + 1;
    await lesson.save();

    await audit(await requireSession(), "lesson.reorder", "lesson", lessonId, {
      courseId,
      targetModuleId,
      moved: true,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Lesson moved." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

/** Reorder resources within a lesson (server-verified, req. 62). */
export async function reorderResourcesAction(
  courseId: string,
  lessonId: string,
  orderedIds: string[]
): Promise<ActionState> {
  try {
    await requireCourseScope(await requireSession(), COURSE_PERMISSIONS.RESOURCES, courseId);
    await connectDB();

    const lesson = await Lesson.findOne({
      _id: toObjectId(lessonId),
      course: toObjectId(courseId),
    })
      .select("_id")
      .lean();
    if (!lesson) return { ok: false, error: "Lesson not found in this course." };

    const resources = await Resource.find({ lesson: lesson._id })
      .select("_id")
      .lean();
    const existing = new Set(resources.map((r) => r._id.toString()));
    if (
      orderedIds.length !== resources.length ||
      !orderedIds.every((id) => existing.has(id))
    ) {
      return { ok: false, error: "Resource order is out of date. Refresh and try again." };
    }

    await applyReorder({
      collection: Resource,
      filter: { lesson: lesson._id },
      orderedIds,
    });

    await audit(await requireSession(), "resource.update", "resource", lessonId, {
      courseId,
      reordered: true,
    });
    revalidateCurriculum(courseId);
    return { ok: true, message: "Resource order saved." };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

