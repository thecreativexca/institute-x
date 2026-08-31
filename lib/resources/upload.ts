import { randomBytes } from "crypto";

import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Course } from "@/models/Course";
import { Lesson } from "@/models/Lesson";
import { Resource, type IResource } from "@/models/Resource";
import type { ResourceAccess } from "@/lib/constants";
import type { Types } from "mongoose";
import { RESOURCE_ERROR, ResourceError } from "./errors";
import {
  buildResourceFolder,
  uploadResourceAsset,
} from "./cloudinary";
import {
  sanitizePublicIdBase,
  validateResourceFile,
} from "./validation";
import { assertResourceRelationship } from "./access";

export interface UploadResourceInput {
  staffId: string;
  file: File;
  courseId: string;
  moduleId: string;
  lessonId: string;
  title: string;
  description?: string;
  access: ResourceAccess;
  isPublished: boolean;
  order: number;
}

export interface UploadedResourceResult {
  id: string;
  title: string;
  type: string;
  mimeType: string;
  fileSize: number;
  access: string;
  isPublished: boolean;
}

/**
 * Full server-side upload flow:
 *   validate file → validate Course→Module→Lesson relationship →
 *   reject exact duplicates (idempotency on retries) →
 *   upload to Cloudinary (server-side, secret never leaves the server) →
 *   save metadata in MongoDB → return a safe payload.
 */
export async function uploadResource(
  input: UploadResourceInput
): Promise<UploadedResourceResult> {
  const validated = await validateResourceFile(input.file);

  await connectDB();

  // --- Relationship validation: never trust client-provided placement ------
  const lesson = await Lesson.findById(toObjectId(input.lessonId))
    .select("course module")
    .lean();

  if (!lesson) {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Lesson not found.");
  }

  await assertResourceRelationship({
    course: lesson.course,
    module: lesson.module,
    lesson: lesson._id,
  });

  // The ids used for storage come from the SERVER-side lesson document,
  // not from the client form fields.
  const courseId = lesson.course.toString();
  const moduleId = lesson.module.toString();

  if (courseId !== input.courseId || moduleId !== input.moduleId) {
    throw new ResourceError(
      RESOURCE_ERROR.RELATIONSHIP_INVALID,
      "The selected course, module and lesson do not match."
    );
  }

  const course = await Course.findById(lesson.course).select("slug").lean();
  if (!course) {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Course not found.");
  }

  // --- Idempotency: an identical retry must not create a second record -----
  const duplicate = await Resource.findOne({
    lesson: lesson._id,
    originalFileName: validated.originalFileName,
    fileSize: validated.buffer.byteLength,
  })
    .select("_id")
    .lean();

  if (duplicate) {
    throw new ResourceError(
      RESOURCE_ERROR.DUPLICATE,
      "An identical file has already been uploaded to this lesson."
    );
  }

  // --- Cloudinary upload (server-side only) --------------------------------
  const folder = buildResourceFolder({
    courseSlug: course.slug,
    moduleId,
    lessonId: input.lessonId,
  });
  const publicId = `${sanitizePublicIdBase(input.title)}-${randomBytes(6).toString("hex")}`;

  let asset;
  try {
    asset = await uploadResourceAsset({
      buffer: validated.buffer,
      folder,
      publicId,
      mimeType: validated.mimeType,
    });
  } catch {
    throw new ResourceError(
      RESOURCE_ERROR.UPLOAD_FAILED,
      "Unable to upload the file right now. Please try again."
    );
  }

  // --- Persist metadata -----------------------------------------------------
  try {
    const created = (await Resource.create({
      course: lesson.course,
      module: lesson.module,
      lesson: lesson._id,
      title: input.title,
      description: input.description ?? undefined,
      type: validated.resourceType,
      fileUrl: asset.fileUrl,
      publicId: asset.publicId,
      mimeType: validated.mimeType,
      fileSize: asset.fileSize,
      originalFileName: validated.originalFileName,
      access: input.access,
      isPublished: input.isPublished,
      sortOrder: input.order,
    })) as IResource & { _id: Types.ObjectId };

    return {
      id: created._id.toString(),
      title: created.title,
      type: created.type,
      mimeType: created.mimeType,
      fileSize: created.fileSize,
      access: created.access,
      isPublished: created.isPublished,
    };
  } catch (error) {
    // DB write failed AFTER the asset exists: keep the Cloudinary asset
    // reachable/loggable so it can be reconciled, and surface a retryable
    // error instead of pretending the upload succeeded.
    console.error(
      "Resource metadata save failed; orphaned Cloudinary asset:",
      asset.publicId,
      error instanceof Error ? error.message : error
    );
    throw new ResourceError(
      RESOURCE_ERROR.UPLOAD_FAILED,
      "The file was uploaded but could not be saved. Please try again."
    );
  }
}
