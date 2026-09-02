import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { USER_ROLES, RESOURCE_ACCESS } from "@/lib/constants";
import { toObjectId } from "@/lib/utils/object-id";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import type { IResource } from "@/models/Resource";
import { Resource } from "@/models/Resource";
import { RESOURCE_ERROR, ResourceError } from "./errors";

/**
 * Roles allowed to upload/manage learning resources.
 * In two-role system: only ADMIN can manage resources.
 */
export const RESOURCE_MANAGER_ROLES: readonly string[] = [
  USER_ROLES.ADMIN,
] as const;

export function isResourceManagerRole(role: string): boolean {
  return RESOURCE_MANAGER_ROLES.includes(role);
}

/** Throws unless the session role may manage resources. */
export function assertResourceManager(role: string): void {
  if (!isResourceManagerRole(role)) {
    throw new ResourceError(
      RESOURCE_ERROR.FORBIDDEN,
      "You do not have permission to manage resources."
    );
  }
}

/** Throws unless the student has an active/completed enrollment in the course. */
export async function assertEnrollment(
  studentId: string,
  courseId: string
): Promise<void> {
  await connectDB();

  const enrollment = await Enrollment.findOne({
    student: toObjectId(studentId),
    course: toObjectId(courseId),
    status: { $in: ["active", "completed"] },
  })
    .select("_id")
    .lean();

  if (!enrollment) {
    throw new ResourceError(
      RESOURCE_ERROR.NOT_ENROLLED,
      "You are not enrolled in this course."
    );
  }
}

/**
 * Verifies the Course → Module → Lesson → Resource chain is internally
 * consistent. Guards against corrupted data AND against clients submitting
 * a course/module/lesson combination that does not exist server-side.
 */
export async function assertResourceRelationship(resource: {
  course: Types.ObjectId;
  module: Types.ObjectId;
  lesson: Types.ObjectId;
}): Promise<void> {
  await connectDB();

  const [lesson, module] = await Promise.all([
    Lesson.findById(resource.lesson).select("_id module course").lean(),
    Module.findById(resource.module).select("_id course").lean(),
  ]);

  const lessonOk =
    lesson &&
    (lesson.module as Types.ObjectId).equals(resource.module) &&
    (lesson.course as Types.ObjectId).equals(resource.course);
  const moduleOk =
    module && (module.course as Types.ObjectId).equals(resource.course);

  if (!lesson || !module || !lessonOk || !moduleOk) {
    throw new ResourceError(
      RESOURCE_ERROR.RELATIONSHIP_INVALID,
      "This resource is not linked correctly and cannot be opened."
    );
  }
}

export interface StudentResourceContext {
  resource: IResource;
  courseId: string;
  lessonId: string;
  backHref: string;
}

/**
 * Full student access chain for a single resource:
 *   1. authenticated student with an ACTIVE account (guaranteed by callers
 *      via getValidatedStudent()/validateSession() — role comes from session)
 *   2. resource exists
 *   3. Course → Module → Lesson → Resource relationship is consistent
 *   4. student is enrolled in the resource's course
 *   5. resource is published
 *   6. resource access is not PRIVATE
 *
 * Returns the resource plus route context for the UI.
 */
export async function getStudentResourceIfAllowed(params: {
  studentId: string;
  resourceId: string;
  options?: { requirePublished?: boolean };
}): Promise<StudentResourceContext> {
  await connectDB();

  const query = Resource.findById(toObjectId(params.resourceId));
  if (params.options?.requirePublished !== false) {
    // Prefer the compound index { lesson, isPublished, sortOrder } where possible.
    query.where({ isPublished: true });
  }

  const resource = await query.lean<IResource | null>();

  if (!resource) {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Resource not found.");
  }

  // Relationship integrity first — a broken chain must never leak content.
  await assertResourceRelationship(resource);

  // The enrollment check uses the resource's OWN course id, never a
  // client-supplied one.
  await assertEnrollment(params.studentId, resource.course.toString());

  if (params.options?.requirePublished !== false && !resource.isPublished) {
    throw new ResourceError(
      RESOURCE_ERROR.NOT_PUBLISHED,
      "This resource is not available."
    );
  }

  if (resource.access === RESOURCE_ACCESS.PRIVATE) {
    throw new ResourceError(
      RESOURCE_ERROR.ACCESS_DENIED,
      "This resource is not available."
    );
  }

  const courseId = resource.course.toString();
  const lessonId = resource.lesson.toString();

  return {
    resource,
    courseId,
    lessonId,
    backHref: `/student/courses/${courseId}/lessons/${lessonId}`,
  };
}

/** Loads a course for display purposes; throws NOT_FOUND when missing/archived-draft. */
export async function loadCourseTitle(courseId: Types.ObjectId): Promise<string> {
  await connectDB();
  const course = await Course.findById(courseId).select("name").lean();
  if (!course) {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Course not found.");
  }
  return course.name;
}