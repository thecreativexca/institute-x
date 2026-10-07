import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/helpers";
import { uploadResourceAsset } from "@/lib/resources/cloudinary";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireAdminApi();
  if (!user || errorResponse) return errorResponse!;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Submit the proof as form data." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: "Choose a payment proof file." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: "Use a JPG, PNG, WebP or PDF up to 10 MB." }, { status: 400 });
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  const publicId = `proof-${Date.now()}-${randomBytes(6).toString("hex")}`;
  try {
    const asset = await uploadResourceAsset({
      buffer: Buffer.from(await file.arrayBuffer()),
      folder: "education-institute/payments/proofs",
      publicId,
      mimeType: file.type,
    });
    return NextResponse.json({
      success: true,
      file: { url: asset.fileUrl, publicId: asset.publicId, fileName: safeName, mimeType: file.type, size: asset.fileSize },
    }, { status: 201 });
  } catch (error) {
    console.error("Payment proof upload failed:", error);
    return NextResponse.json({ success: false, error: "Unable to upload payment proof." }, { status: 500 });
  }
}
