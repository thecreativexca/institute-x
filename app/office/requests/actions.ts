"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { ADMISSION_REQUEST_STATUSES, AdmissionRequest } from "@/models/AdmissionRequest";

export async function updateAdmissionRequestStatus(formData: FormData) {
  await requireAdmin();
  const requestId = String(formData.get("requestId") || "");
  const status = String(formData.get("status") || "");
  if (!Types.ObjectId.isValid(requestId) || !ADMISSION_REQUEST_STATUSES.includes(status as (typeof ADMISSION_REQUEST_STATUSES)[number])) return;

  await connectDB();
  await AdmissionRequest.findByIdAndUpdate(requestId, { status });
  revalidatePath("/office/requests");
}
