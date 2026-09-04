import "server-only";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

export async function notifyUser(input: { recipientId: string | Types.ObjectId; title: string; message: string; type?: "info" | "success" | "warning" | "error"; link?: string }) {
  await connectDB();
  return Notification.create({ recipient: input.recipientId, title: input.title, message: input.message, type: input.type ?? "info", link: input.link });
}

export async function notifyAdmins(input: Omit<Parameters<typeof notifyUser>[0], "recipientId">) {
  await connectDB();
  const ids = await User.find({ role: "admin", status: "active" }).distinct("_id");
  if (!ids.length) return;
  await Notification.insertMany(ids.map((recipient) => ({ recipient, ...input, type: input.type ?? "info" })), { ordered: false });
}
