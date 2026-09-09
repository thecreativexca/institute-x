import "server-only";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { USER_ROLES } from "@/lib/constants";
import { Enrollment } from "@/models/Enrollment";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

type NotificationInput = {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
};

export async function notifyUser(input: {
  recipientId: string | Types.ObjectId;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}) {
  await connectDB();
  return Notification.create({
    recipient: input.recipientId,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
    link: input.link,
  });
}

export async function notifyUsers(
  recipientIds: Array<string | Types.ObjectId>,
  input: NotificationInput,
) {
  await connectDB();
  const unique = [
    ...new Set(
      recipientIds
        .map((id) => id.toString())
        .filter((id) => Types.ObjectId.isValid(id)),
    ),
  ];
  if (!unique.length) return;
  await Notification.insertMany(
    unique.map((recipient) => ({
      recipient: new Types.ObjectId(recipient),
      title: input.title,
      message: input.message,
      type: input.type ?? "info",
      link: input.link,
    })),
    { ordered: false },
  );
}

export async function notifyCourseStudents(
  courseId: string | Types.ObjectId,
  input: NotificationInput,
) {
  await connectDB();
  const studentIds = await Enrollment.find({
    course: courseId,
    status: { $in: ["active", "completed"] },
  }).distinct("student");
  await notifyUsers(studentIds, input);
}

export async function notifyAdmins(
  input: Omit<Parameters<typeof notifyUser>[0], "recipientId">,
) {
  await connectDB();
  const ids = await User.find({
    role: USER_ROLES.ADMIN,
    status: "active",
  }).distinct("_id");
  if (!ids.length) return;
  await Notification.insertMany(
    ids.map((recipient) => ({
      recipient,
      ...input,
      type: input.type ?? "info",
    })),
    { ordered: false },
  );
}

/** Best-effort helper so notification failures never break primary actions. */
export async function safeNotify(
  task: () => Promise<unknown>,
  context: string,
) {
  try {
    await task();
  } catch (error) {
    console.error(`${context} notification failed:`, error);
  }
}
