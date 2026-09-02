"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getValidatedSession } from "@/lib/auth/helpers";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Session } from "@/models/Session";
import { Course } from "@/models/Course";
import { SESSION_STATUSES, USER_ROLES } from "@/lib/constants";
import { recordAuditEvent } from "@/lib/audit/log";
import type { SessionUser } from "@/lib/auth/session";
import { sessionFormSchema, sessionFormToDate, type SessionFormInput } from "./validation";

export interface ActionState {
  ok: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

class SessionPermissionError extends Error {}

function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

async function authorize(permission: string): Promise<SessionUser> {
  const { user } = await getValidatedSession();
  if (!user || user.role !== USER_ROLES.ADMIN) {
    throw new SessionPermissionError("Please sign in as an administrator.");
  }
  if (!hasPermission(user.role, permission as (typeof PERMISSIONS)[keyof typeof PERMISSIONS])) {
    throw new SessionPermissionError("You do not have permission to manage sessions.");
  }
  return user;
}

async function ensureCourseExists(courseId: string): Promise<void> {
  await connectDB();
  const course = await Course.findById(toObjectId(courseId)).select("_id").lean();
  if (!course) {
    throw new SessionPermissionError("The selected course no longer exists.");
  }
}

function parseSessionInput(formData: FormData): SessionFormInput {
  return {
    courseId: String(formData.get("courseId") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    venue: String(formData.get("venue") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    instructorName: String(formData.get("instructorName") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    status: (String(formData.get("status") ?? SESSION_STATUSES.SCHEDULED) ||
      SESSION_STATUSES.SCHEDULED) as SessionFormInput["status"],
    isDisplayed: formData.get("isDisplayed") === "on" || formData.get("isDisplayed") === "true",
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof SessionPermissionError) return error.message;
  if (error instanceof z.ZodError) return "Please review the highlighted fields.";
  if (error instanceof Error && /duplicate key/i.test(error.message)) {
    return "That session already exists.";
  }
  console.error("Session action failed:", error);
  return "Something went wrong. Please try again.";
}

export async function createSessionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await authorize(PERMISSIONS.SESSIONS_MANAGE);
    await ensureCourseExists(String(formData.get("courseId") ?? ""));

    const parsed = sessionFormSchema.safeParse(parseSessionInput(formData));
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
    }
    const input = parsed.data;

    await connectDB();
    const doc = await Session.create({
      course: toObjectId(input.courseId),
      title: input.title,
      date: sessionFormToDate(input.date),
      startTime: input.startTime || undefined,
      endTime: input.endTime || undefined,
      venue: input.venue,
      address: input.address || undefined,
      instructorName: input.instructorName || undefined,
      notes: input.notes || undefined,
      status: input.status,
      isDisplayed: input.isDisplayed,
      sortOrder: 0,
    });

    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "session.create",
      entityType: "session",
      entityId: doc._id.toString(),
      metadata: { courseId: input.courseId, title: input.title, date: input.date },
    });

    revalidatePath("/office/sessions");
    return { ok: true, message: "Class scheduled successfully." };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateSessionAction(
  sessionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await authorize(PERMISSIONS.SESSIONS_MANAGE);
    await ensureCourseExists(String(formData.get("courseId") ?? ""));

    const parsed = sessionFormSchema.safeParse(parseSessionInput(formData));
    if (!parsed.success) {
      return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
    }
    const input = parsed.data;

    await connectDB();
    const session = await Session.findById(toObjectId(sessionId)).lean();
    if (!session) {
      return { ok: false, error: "Session not found." };
    }

    await Session.updateOne(
      { _id: session._id },
      {
        $set: {
          course: toObjectId(input.courseId),
          title: input.title,
          date: sessionFormToDate(input.date),
          startTime: input.startTime || undefined,
          endTime: input.endTime || undefined,
          venue: input.venue,
          address: input.address || undefined,
          instructorName: input.instructorName || undefined,
          notes: input.notes || undefined,
          status: input.status,
          isDisplayed: input.isDisplayed,
        },
      }
    );

    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "session.update",
      entityType: "session",
      entityId: sessionId,
      metadata: { courseId: input.courseId, title: input.title, date: input.date },
    });

    revalidatePath("/office/sessions");
    return { ok: true, message: "Class updated successfully." };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteSessionAction(sessionId: string): Promise<ActionState> {
  try {
    const user = await authorize(PERMISSIONS.SESSIONS_MANAGE);
    await connectDB();
    const session = await Session.findById(toObjectId(sessionId)).lean();
    if (!session) {
      return { ok: false, error: "Session not found." };
    }

    await Session.deleteOne({ _id: session._id });
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "session.delete",
      entityType: "session",
      entityId: sessionId,
      metadata: { courseId: session.course.toString(), title: session.title },
    });

    revalidatePath("/office/sessions");
    return { ok: true, message: "Class removed." };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setSessionDisplayAction(sessionId: string, isDisplayed: boolean): Promise<ActionState> {
  try {
    const user = await authorize(PERMISSIONS.SESSIONS_MANAGE);
    await connectDB();
    const session = await Session.findById(toObjectId(sessionId)).lean();
    if (!session) {
      return { ok: false, error: "Session not found." };
    }
    await Session.updateOne({ _id: session._id }, { $set: { isDisplayed: !!isDisplayed } });
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "session.update",
      entityType: "session",
      entityId: sessionId,
      metadata: { isDisplayed: !!isDisplayed },
    });
    revalidatePath("/office/sessions");
    return { ok: true, message: isDisplayed ? "Now visible to students." : "Hidden from students." };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
