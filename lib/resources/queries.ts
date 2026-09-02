import type { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { RESOURCE_ACCESS, type LessonContentType } from "@/lib/constants";
import { toObjectId } from "@/lib/utils/object-id";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import type { IResource } from "@/models/Resource";
import { Resource } from "@/models/Resource";
import {
  assertEnrollment,
  assertResourceRelationship,
} from "./access";
import { RESOURCE_ERROR, ResourceError } from "./errors";

/** Fields safe to send to the student UI (no Cloudinary internals). */
export type StudentResourceView = Pick<
  IResource,
  "_id" | "title" | "description" | "type" | "mimeType" | "fileSize" | "access"
>;

/**
 * Loads the lesson context a student is allowed to see:
 * lesson → module → course chain plus enrollment in the course.
 * Throws ResourceError on any failure.
 */
export async function getStudentLessonContext(params: {
  studentId: string;
  lessonId: string;
}): Promise<{
  lessonTitle: string;
  lessonContent: string | null;
  contentType: LessonContentType;
  /** YouTube watch/embed URL when the lesson is a video lesson. */
  videoUrl: string | null;
  /** Direct PDF file URL when the lesson body is an uploaded PDF. */
  pdfUrl: string | null;
  moduleTitle: string | null;
  courseName: string;
  courseId: string;
}> {
  await connectDB();

  let lessonId: Types.ObjectId;
  try {
    lessonId = toObjectId(params.lessonId);
  } catch {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Lesson not found.");
  }

  const lesson = await Lesson.findById(lessonId)
    .select("title content course module contentType videoUrl pdfUrl")
    .lean();

  if (!lesson) {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Lesson not found.");
  }

  await assertResourceRelationship({
    course: lesson.course as Types.ObjectId,
    module: lesson.module as Types.ObjectId,
    lesson: lesson._id as Types.ObjectId,
  });

  await assertEnrollment(params.studentId, lesson.course.toString());

  const [module, course] = await Promise.all([
    Module.findById(lesson.module).select("title").lean(),
    Course.findById(lesson.course).select("name").lean(),
  ]);

  if (!course) {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Course not found.");
  }

  return {
    lessonTitle: lesson.title,
    lessonContent: lesson.content ?? null,
    contentType: lesson.contentType ?? "video",
    videoUrl: lesson.videoUrl ?? null,
    pdfUrl: lesson.pdfUrl ?? null,
    moduleTitle: module?.title ?? null,
    courseName: course.name,
    courseId: lesson.course.toString(),
  };
}

/**
 * Published, student-visible resources for one lesson, in display order.
 * PRIVATE resources are excluded; projections keep payloads small.
 */
export async function listStudentLessonResources(
  lessonId: string
): Promise<StudentResourceView[]> {
  await connectDB();

  const resources = await Resource.find({
    lesson: toObjectId(lessonId),
    isPublished: true,
    access: { $ne: RESOURCE_ACCESS.PRIVATE },
  })
    .select("title description type mimeType fileSize access")
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean<IResource[]>();

  return resources.map((resource) => ({
    _id: resource._id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    mimeType: resource.mimeType,
    fileSize: resource.fileSize,
    access: resource.access,
  }));
}

/** Staff-only: recent resources with minimal course/lesson context. */
export async function listRecentResourcesForStaff(limit = 20): Promise<
  Array<{
    id: string;
    title: string;
    type: string;
    access: string;
    fileSize: number;
    isPublished: boolean;
    lessonTitle: string | null;
    createdAt: string;
  }>
> {
  await connectDB();

  const resources = await Resource.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title type access fileSize isPublished lesson createdAt")
    .populate<{ lesson: { title: string } | null }>("lesson", "title")
    .lean();

  return resources.map((resource) => ({
    id: resource._id.toString(),
    title: resource.title,
    type: resource.type,
    access: resource.access,
    fileSize: resource.fileSize,
    isPublished: resource.isPublished,
    lessonTitle:
      resource.lesson && typeof resource.lesson === "object"
        ? resource.lesson.title
        : null,
    createdAt: (resource.createdAt ?? new Date()).toISOString(),
  }));
}
