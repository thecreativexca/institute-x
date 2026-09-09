import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { uploadResourceAsset } from "@/lib/resources/cloudinary";

export const runtime = "nodejs";
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const { user } = await getValidatedSession();
  if (!user || user.status !== "active")
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  const data = await request.formData(),
    file = data.get("file");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json(
      { success: false, error: "Choose a file." },
      { status: 400 },
    );
  if (file.size > MAX_BYTES || !ALLOWED.has(file.type))
    return NextResponse.json(
      { success: false, error: "Unsupported file or file exceeds 20 MB." },
      { status: 400 },
    );
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
  const publicId = `${safeName.replace(/\.[^.]+$/, "")}-${randomBytes(8).toString("hex")}`;
  try {
    const asset = await uploadResourceAsset({
      buffer: Buffer.from(await file.arrayBuffer()),
      folder: `education-institute/internships/${user.role}`,
      publicId,
      mimeType: file.type,
    });
    return NextResponse.json(
      {
        success: true,
        file: {
          url: asset.fileUrl,
          publicId: asset.publicId,
          filename: safeName,
          mimeType: file.type,
          size: asset.fileSize,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to upload the file." },
      { status: 500 },
    );
  }
}
