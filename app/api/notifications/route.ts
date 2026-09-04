import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";

import { getValidatedSession } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/models/Notification";

export async function GET() {
  const { user } = await getValidatedSession();
  if (!user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  await connectDB();
  const [rows, unreadCount] = await Promise.all([
    Notification.find({ recipient: user.id }).sort({ createdAt: -1 }).limit(12).lean(),
    Notification.countDocuments({ recipient: user.id, isRead: false }),
  ]);
  return NextResponse.json({ success: true, unreadCount, notifications: rows.map((row) => ({ id: row._id.toString(), title: row.title, message: row.message, type: row.type, link: row.link ?? null, isRead: row.isRead, createdAt: row.createdAt.toISOString() })) });
}

const patchSchema = z.object({ id: z.string().optional(), all: z.boolean().optional() }).refine((value) => value.all || (value.id && Types.ObjectId.isValid(value.id)));

export async function PATCH(request: Request) {
  const { user } = await getValidatedSession();
  if (!user) return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid notification." }, { status: 400 });
  await connectDB();
  const filter = parsed.data.all ? { recipient: user.id, isRead: false } : { _id: parsed.data.id, recipient: user.id };
  await Notification.updateMany(filter, { $set: { isRead: true, readAt: new Date() } });
  return NextResponse.json({ success: true });
}
