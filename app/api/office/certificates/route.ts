import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  formString,
  requireAdminForCertificates,
  searchParamsToObject,
  toCertificateErrorResponse,
  validationError,
} from "@/lib/office/certificates/http";
import { listOfficeCertificates } from "@/lib/office/certificates/queries";
import { createCertificate } from "@/lib/office/certificates/service";
import {
  certificateFiltersSchema,
  certificateUploadSchema,
} from "@/lib/office/certificates/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/office/certificates
 *
 *   GET  — paginated admin certificate list (search / course / status / date
 *          filters, sortable, page+limit).
 *   POST — multipart create: uploads the certificate file to Cloudinary
 *          server-side and assigns it to a student.
 *
 * ADMIN ONLY. `requireAdminForCertificates` reads the role from the validated
 * session, so a student calling this endpoint receives 403 and never reaches
 * the query or service layer.
 */

export async function GET(request: NextRequest) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsed = certificateFiltersSchema.safeParse(
    searchParamsToObject(request.nextUrl.searchParams)
  );
  if (!parsed.success) return validationError(parsed, "Invalid filter options.");

  try {
    const result = await listOfficeCertificates(parsed.data);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("Expected multipart form data.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return badRequest("Please choose a certificate file (PDF, JPG or PNG).");
  }

  const parsed = certificateUploadSchema.safeParse({
    studentId: formString(formData, "studentId"),
    courseId: formString(formData, "courseId"),
    certificateTitle: formString(formData, "certificateTitle"),
    certificateNumber: formString(formData, "certificateNumber"),
    issueDate: formString(formData, "issueDate"),
    completionDate: formString(formData, "completionDate"),
    grade: formString(formData, "grade"),
    notes: formString(formData, "notes"),
  });
  if (!parsed.success) return validationError(parsed);

  try {
    const certificate = await createCertificate({
      input: parsed.data,
      file,
      actor: guard.actor,
    });
    return NextResponse.json(
      {
        success: true,
        message: "Certificate uploaded successfully.",
        certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
