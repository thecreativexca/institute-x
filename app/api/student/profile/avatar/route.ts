import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_MB,
  avatarPublicIdForUser,
  buildAvatarDeliveryUrl,
  deleteAvatarAsset,
  uploadAvatarAsset,
} from "@/lib/resources/avatars";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user } = await getValidatedStudent();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Please choose an image." },
        { status: 400 },
      );
    }

    const mimeType = (file.type || "").toLowerCase();
    if (
      !ALLOWED_AVATAR_MIME_TYPES.includes(
        mimeType as (typeof ALLOWED_AVATAR_MIME_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Only JPG, JPEG, PNG or WebP images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `Images must be ${MAX_AVATAR_SIZE_MB} MB or smaller.` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadAvatarAsset({ buffer, userId: user.id });
    const avatarUrl = buildAvatarDeliveryUrl(asset.publicId);

    await connectDB();
    await User.updateOne(
      { _id: user.id, role: "student" },
      { $set: { avatarUrl } },
    );
    revalidatePath("/student", "layout");
    revalidatePath("/student/profile");

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("Student avatar upload failed:", error);
    return NextResponse.json(
      { success: false, error: "The image could not be uploaded. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const { user } = await getValidatedStudent();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    await User.updateOne(
      { _id: user.id, role: "student" },
      { $unset: { avatarUrl: "" } },
    );
    await deleteAvatarAsset(avatarPublicIdForUser(user.id));
    revalidatePath("/student", "layout");
    revalidatePath("/student/profile");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student avatar delete failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to remove profile photo." },
      { status: 500 },
    );
  }
}
