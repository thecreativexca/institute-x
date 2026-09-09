import { connectDB } from "@/lib/db/connect";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { Types } from "mongoose";
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/constants";
import {
  notifyCourseStudents,
  notifyUser,
  safeNotify,
} from "@/lib/notifications/service";
import { CreateAssignmentInput, UpdateAssignmentInput, GradeSubmissionInput } from "./validation";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export async function createAssignment(
  input: CreateAssignmentInput,
  actorId: string,
  actorRole: string
): Promise<{ assignmentId: string } | { error: string }> {
  await connectDB();

  const course = await Course.findById(toObjectId(input.courseId)).lean();
  if (!course) return { error: "Course not found" };

  if (course.status !== "published") {
    return { error: "Cannot create assignment for unpublished course" };
  }

  if (input.moduleId) {
    const moduleDoc = await Module.findOne({
      _id: toObjectId(input.moduleId),
      course: toObjectId(input.courseId),
    }).lean();
    if (!moduleDoc) return { error: "Module not found in this course" };
  }

  if (input.lessonId) {
    const lesson = await Lesson.findOne({
      _id: toObjectId(input.lessonId),
      course: toObjectId(input.courseId),
    }).lean();
    if (!lesson) return { error: "Lesson not found in this course" };
    if (input.moduleId) {
      const lessonDoc = await Lesson.findById(toObjectId(input.lessonId)).lean();
      if (lessonDoc && !lessonDoc.module.equals(toObjectId(input.moduleId))) {
        return { error: "Lesson does not belong to the selected moduleDoc" };
      }
    }
  }

  const assignment = await Assignment.create({
    course: toObjectId(input.courseId),
    module: input.moduleId ? toObjectId(input.moduleId) : undefined,
    lesson: input.lessonId ? toObjectId(input.lessonId) : undefined,
    title: input.title.trim(),
    instructions: input.instructions.trim(),
    maxScore: input.maxScore,
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    isPublished: input.isPublished ?? false,
  });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "assignment.create",
    entityType: "assignment",
    entityId: assignment._id,
    metadata: {
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      title: input.title,
      maxScore: input.maxScore,
      isPublished: input.isPublished ?? false,
    },
  });

  if (input.isPublished) {
    await AuditLog.create({
      actorUserId: toObjectId(actorId),
      actorRole,
      action: "assignment.publish",
      entityType: "assignment",
      entityId: assignment._id,
      metadata: { title: input.title },
    });
    await safeNotify(
      () =>
        notifyCourseStudents(assignment.course, {
          title: "New assignment published",
          message: `“${assignment.title}” is now available in ${course.name}.`,
          type: "info",
          link: "/student/assignments",
        }),
      "Assignment publish",
    );
  }

  return { assignmentId: assignment._id.toString() };
}

export async function updateAssignment(
  assignmentId: string,
  input: UpdateAssignmentInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const assignment = await Assignment.findById(toObjectId(assignmentId));
  if (!assignment) return { error: "Assignment not found" };

  const oldData = {
    title: assignment.title,
    instructions: assignment.instructions,
    dueAt: assignment.dueAt,
    maxScore: assignment.maxScore,
    module: assignment.module,
    lesson: assignment.lesson,
    isPublished: assignment.isPublished,
  };

  if (input.moduleId !== undefined) {
    if (input.moduleId) {
      const moduleDoc = await Module.findOne({
        _id: toObjectId(input.moduleId),
        course: assignment.course,
      }).lean();
      if (!moduleDoc) return { error: "Module not found in this course" };
      assignment.module = toObjectId(input.moduleId);
    } else {
      assignment.module = undefined;
    }
  }

  if (input.lessonId !== undefined) {
    if (input.lessonId) {
      const lesson = await Lesson.findOne({
        _id: toObjectId(input.lessonId),
        course: assignment.course,
      }).lean();
      if (!lesson) return { error: "Lesson not found in this course" };
      if (assignment.module) {
        const lessonDoc = await Lesson.findById(toObjectId(input.lessonId)).lean();
        if (lessonDoc && !lessonDoc.module.equals(assignment.module)) {
          return { error: "Lesson does not belong to the selected moduleDoc" };
        }
      }
      assignment.lesson = toObjectId(input.lessonId);
    } else {
      assignment.lesson = undefined;
    }
  }

  if (input.title !== undefined) assignment.title = input.title.trim();
  if (input.instructions !== undefined) assignment.instructions = input.instructions.trim();
  if (input.dueAt !== undefined) assignment.dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (input.maxScore !== undefined) {
    if (input.maxScore < 1) return { error: "Max score must be at least 1" };
    const gradedSubmissions = await Submission.countDocuments({
      assignment: assignment._id,
      status: SUBMISSION_STATUSES.GRADED,
      score: { $gt: input.maxScore },
    });
    if (gradedSubmissions > 0) {
      return { error: `Cannot reduce max score below existing graded submissions (${gradedSubmissions} submissions would be affected)` };
    }
    assignment.maxScore = input.maxScore;
  }
  if (input.isPublished !== undefined) {
    const wasPublished = assignment.isPublished;
    assignment.isPublished = input.isPublished;
    if (!wasPublished && input.isPublished) {
      await AuditLog.create({
        actorUserId: toObjectId(actorId),
        actorRole,
        action: "assignment.publish",
        entityType: "assignment",
        entityId: assignment._id,
        metadata: { title: assignment.title },
      });
      const course = await Course.findById(assignment.course).select("name").lean();
      await safeNotify(
        () =>
          notifyCourseStudents(assignment.course, {
            title: "New assignment published",
            message: `“${assignment.title}” is now available${course?.name ? ` in ${course.name}` : ""}.`,
            type: "info",
            link: "/student/assignments",
          }),
        "Assignment publish",
      );
    } else if (wasPublished && !input.isPublished) {
      await AuditLog.create({
        actorUserId: toObjectId(actorId),
        actorRole,
        action: "assignment.unpublish",
        entityType: "assignment",
        entityId: assignment._id,
        metadata: { title: assignment.title },
      });
    }
  }

  const changedFields: Record<string, { old: unknown; new: unknown }> = {};
  if (input.title !== undefined && input.title.trim() !== oldData.title) {
    changedFields.title = { old: oldData.title, new: input.title.trim() };
  }
  if (input.instructions !== undefined && input.instructions.trim() !== oldData.instructions) {
    changedFields.instructions = { old: oldData.instructions, new: input.instructions.trim() };
  }
  if (input.dueAt !== undefined) {
    const newDueAt = input.dueAt ? new Date(input.dueAt) : null;
    if (oldData.dueAt?.getTime() !== newDueAt?.getTime()) {
      changedFields.dueAt = { old: oldData.dueAt?.toISOString() ?? null, new: newDueAt?.toISOString() ?? null };
    }
  }
  if (input.maxScore !== undefined && input.maxScore !== oldData.maxScore) {
    changedFields.maxScore = { old: oldData.maxScore, new: input.maxScore };
  }
  if (input.moduleId !== undefined) {
    const newModuleId = input.moduleId ? toObjectId(input.moduleId) : null;
    if (oldData.module?.toString() !== newModuleId?.toString()) {
      changedFields.module = { old: oldData.module?.toString() ?? null, new: newModuleId?.toString() ?? null };
    }
  }
  if (input.lessonId !== undefined) {
    const newLessonId = input.lessonId ? toObjectId(input.lessonId) : null;
    if (oldData.lesson?.toString() !== newLessonId?.toString()) {
      changedFields.lesson = { old: oldData.lesson?.toString() ?? null, new: newLessonId?.toString() ?? null };
    }
  }
  if (input.isPublished !== undefined && input.isPublished !== oldData.isPublished) {
    changedFields.isPublished = { old: oldData.isPublished, new: input.isPublished };
  }

  await assignment.save();

  if (Object.keys(changedFields).length > 0) {
    await AuditLog.create({
      actorUserId: toObjectId(actorId),
      actorRole,
      action: "assignment.update",
      entityType: "assignment",
      entityId: assignment._id,
      metadata: { changedFields },
    });
  }

  return { success: true };
}

export async function deleteAssignment(
  assignmentId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const assignment = await Assignment.findById(toObjectId(assignmentId));
  if (!assignment) return { error: "Assignment not found" };

  const submissionCount = await Submission.countDocuments({ assignment: assignment._id });
  if (submissionCount > 0) {
    return { error: "Cannot delete assignment with existing submissions. Unpublish instead." };
  }

  await assignment.deleteOne();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "assignment.delete",
    entityType: "assignment",
    entityId: assignment._id,
    metadata: { title: assignment.title },
  });

  return { success: true };
}

export async function gradeSubmission(
  assignmentId: string,
  submissionId: string,
  input: GradeSubmissionInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const assignment = await Assignment.findById(toObjectId(assignmentId));
  if (!assignment) return { error: "Assignment not found" };

  const submission = await Submission.findOne({
    _id: toObjectId(submissionId),
    assignment: assignment._id,
  });

  if (!submission) return { error: "Submission not found" };

  if (input.score < 0 || input.score > assignment.maxScore) {
    return { error: `Score must be between 0 and ${assignment.maxScore}` };
  }

  const isRegrade = submission.status === SUBMISSION_STATUSES.GRADED;
  const previousScore = submission.score;
  const previousFeedback = submission.feedback;

  submission.score = input.score;
  submission.totalMarks = assignment.maxScore;
  submission.feedback = input.feedback.trim();
  submission.gradedAt = new Date();
  submission.status = input.status === "returned_for_resubmission" ? SUBMISSION_STATUSES.SUBMITTED : SUBMISSION_STATUSES.GRADED;
  await submission.save();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: isRegrade ? "submission.regrade" : "submission.grade",
    entityType: "submission",
    entityId: submission._id,
    metadata: {
      assignmentId: assignment._id.toString(),
      studentId: submission.student.toString(),
      score: input.score,
      maxScore: assignment.maxScore,
      feedback: input.feedback,
      internalNote: input.internalNote,
      previousScore,
      previousFeedback,
      isRegrade,
    },
  });

  if (!isRegrade) {
    try {
      const student = await User.findById(submission.student).select("name email").lean();
      if (student) {
        const { sendAssignmentGradedEmail } = await import("@/lib/email/events");
        await sendAssignmentGradedEmail({
          studentId: student._id.toString(),
          studentName: student.name,
          studentEmail: student.email,
          courseId: assignment.course.toString(),
          courseName: (await Course.findById(assignment.course).select("name").lean())?.name ?? "Course",
          assignmentId: assignment._id.toString(),
          assignmentTitle: assignment.title,
          submissionId: submission._id.toString(),
          score: input.score,
          maxScore: assignment.maxScore,
          feedback: input.feedback,
          gradedAt: submission.gradedAt!,
        });
      }
    } catch (emailError) {
      console.error("Failed to send assignment graded email:", emailError);
    }
  }

  await safeNotify(
    () =>
      notifyUser({
        recipientId: submission.student,
        title:
          input.status === "returned_for_resubmission"
            ? "Assignment needs revision"
            : "Assignment graded",
        message:
          input.feedback.trim() ||
          `Your submission for “${assignment.title}” was reviewed.`,
        type:
          input.status === "returned_for_resubmission" ? "warning" : "success",
        link: "/student/assignments",
      }),
    "Assignment grade",
  );

  return { success: true };
}

export async function getAssignmentModules(courseId: string) {
  await connectDB();
  return Module.find({ course: toObjectId(courseId) }).select("title sortOrder").sort({ sortOrder: 1 }).lean();
}

export async function getModuleLessons(moduleId: string) {
  await connectDB();
  return Lesson.find({ module: toObjectId(moduleId), isPublished: true }).select("title sortOrder").sort({ sortOrder: 1 }).lean();
}