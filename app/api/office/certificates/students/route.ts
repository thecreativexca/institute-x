import { NextRequest, NextResponse } from "next/server";

import {
  requireAdminForCertificates,
  searchParamsToObject,
  toCertificateErrorResponse,
  validationError,
} from "@/lib/office/certificates/http";
import { searchStudentsForCertificates } from "@/lib/office/certificates/queries";
import { studentSearchSchema } from "@/lib/office/certificates/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/office/certificates/students?q=&limit= — ADMIN ONLY.
 *
 * Searchable student list backing the upload form's combobox. Returns ONLY
 * `{ id, label, hint }` — the admin UI needs nothing else, and student PII
 * (phone, address, payment data) has no reason to travel here.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsed = studentSearchSchema.safeParse(
    searchParamsToObject(request.nextUrl.searchParams)
  );
  if (!parsed.success) return validationError(parsed, "Invalid search options.");

  try {
    const students = await searchStudentsForCertificates(
      parsed.data.q,
      parsed.data.limit
    );
    return NextResponse.json({ success: true, students }, { status: 200 });
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
