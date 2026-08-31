import { connectDB } from "@/lib/db/connect";
import { Announcement } from "@/models/Announcement";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { Types } from "mongoose";
import { AUDIENCES, type Audience } from "@/lib/constants";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "./validation";
import { getAnnouncementAudience } from "./queries";
import { sendAnnouncementEmail } from "@/lib/email/events";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
  actorId: string,
  actorRole: string
): Promise<{ announcementId: string } | { error: string }> {
  await connectDB();

  if (input.audience === AUDIENCES.STUDENTS) {
    if (!input.courseId || !Types.ObjectId.isValid(input.courseId)) {
      return { error: "Course is required for course-specific announcements" };
    }
    const course = await Course.findById(toObjectId(input.courseId)).lean();
    if (!course) return { error: "Course not found" };
  }

  const announcement = await Announcement.create({
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience,
    createdBy: toObjectId(actorId),
    isActive: input.isActive ?? true,
    publishedAt: input.isActive ? new Date() : null,
  });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "announcement.create",
    entityType: "announcement",
    entityId: announcement._id,
    metadata: {
      title: input.title,
      audience: input.audience,
      courseId: input.courseId,
      isActive: input.isActive ?? true,
    },
  });

  if (input.sendEmail && input.isActive) {
    const audienceResult = await getAnnouncementAudience(input.audience, input.courseId);
    if (audienceResult.count > 0) {
      const students = await User.find({ _id: { $in: audienceResult.studentIds.map(toObjectId) } })
        .select("name email")
        .lean();

      for (const student of students) {
        try {
          await sendAnnouncementEmail({
            studentId: student._id.toString(),
            studentName: student.name,
            studentEmail: student.email,
            announcementId: announcement._id.toString(),
            announcementTitle: announcement.title,
            announcementBody: announcement.body,
            publishedAt: announcement.publishedAt!,
          });
        } catch (emailError) {
          console.error(`Failed to send announcement email to ${student.email}:`, emailError);
        }
      }
    }
  }

  return { announcementId: announcement._id.toString() };
}

export async function updateAnnouncement(
  announcementId: string,
  input: UpdateAnnouncementInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const announcement = await Announcement.findById(toObjectId(announcementId));
  if (!announcement) return { error: "Announcement not found" };

  const oldData = {
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    course: announcement.course,
    isActive: announcement.isActive,
  };

  const wasActive = announcement.isActive;

  if (input.audience !== undefined) {
    if (input.audience === AUDIENCES.STUDENTS) {
      if (!input.courseId || !Types.ObjectId.isValid(input.courseId)) {
        return { error: "Course is required for course-specific announcements" };
      }
      const course = await Course.findById(toObjectId(input.courseId)).lean();
      if (!course) return { error: "Course not found" };
      announcement.audience = input.audience;
      announcement.course = toObjectId(input.courseId);
    } else {
      announcement.audience = input.audience;
      announcement.course = null;
    }
  }

  if (input.courseId !== undefined && input.audience !== AUDIENCES.STUDENTS) {
    announcement.course = input.courseId ? toObjectId(input.courseId) : null;
  }

  if (input.title !== undefined) announcement.title = input.title.trim();
  if (input.body !== undefined) announcement.body = input.body.trim();
  if (input.isActive !== undefined) {
    announcement.isActive = input.isActive;
    if (!wasActive && input.isActive) {
      announcement.publishedAt = new Date();
    } else if (wasActive && !input.isActive) {
      announcement.publishedAt = null;
    }
  }

  const changedFields: Record<string, { old: unknown; new: unknown }> = {};
  if (input.title !== undefined && input.title.trim() !== oldData.title) {
    changedFields.title = { old: oldData.title, new: input.title.trim() };
  }
  if (input.body !== undefined && input.body.trim() !== oldData.body) {
    changedFields.body = { old: oldData.body, new: input.body.trim() };
  }
  if (input.audience !== undefined && input.audience !== oldData.audience) {
    changedFields.audience = { old: oldData.audience, new: input.audience };
  }
  if (input.courseId !== undefined && input.courseId !== (oldData.course?.toString() ?? null)) {
    changedFields.courseId = { old: oldData.course?.toString() ?? null, new: input.courseId };
  }
  if (input.isActive !== undefined && input.isActive !== oldData.isActive) {
    changedFields.isActive = { old: oldData.isActive, new: input.isActive };
  }

  await announcement.save();

  if (Object.keys(changedFields).length > 0) {
    await AuditLog.create({
      actorUserId: toObjectId(actorId),
      actorRole,
      action: "announcement.update",
      entityType: "announcement",
      entityId: announcement._id,
      metadata: { changedFields },
    });
  }

  return { success: true };
}

export async function deleteAnnouncement(
  announcementId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const announcement = await Announcement.findById(toObjectId(announcementId));
  if (!announcement) return { error: "Announcement not found" };

  await announcement.deleteOne();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "announcement.delete",
    entityType: "announcement",
    entityId: announcement._id,
    metadata: { title: announcement.title },
  });

  return { success: true };
}

export async function archiveAnnouncement(
  announcementId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const announcement = await Announcement.findById(toObjectId(announcementId));
  if (!announcement) return { error: "Announcement not found" };

  announcement.isActive = false;
  await announcement.save();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "announcement.archive",
    entityType: "announcement",
    entityId: announcement._id,
    metadata: { title: announcement.title },
  });

  return { success: true };
}