import { NextResponse } from "next/server";

/**
 * Certificate-domain error codes. Kept in one place so route handlers and the
 * issuance service can map failures to user-friendly messages without ever
 * leaking internal details (stack traces, DB/Cloudinary identifiers).
 */
export const CERTIFICATE_ERROR = {
  NOT_ELIGIBLE: "NOT_ELIGIBLE",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_ISSUED: "ALREADY_ISSUED",
  ACCESS_DENIED: "ACCESS_DENIED",
  GENERATION_FAILED: "GENERATION_FAILED",
  STORAGE_FAILED: "STORAGE_FAILED",
  INVALID_IDENTIFIER: "INVALID_IDENTIFIER",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL",
  /* ----- Admin Certificate Management module ----- */
  /** Certificate number already exists (unique index / pre-check). */
  DUPLICATE_NUMBER: "DUPLICATE_NUMBER",
  /** No file supplied, or the file could not be read. */
  INVALID_FILE: "INVALID_FILE",
  /** MIME type / extension / magic bytes rejected. */
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  /** File exceeds the configured size cap. */
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  /** Student id does not resolve to a real student account. */
  STUDENT_NOT_FOUND: "STUDENT_NOT_FOUND",
  /** Course id does not resolve to a real course. */
  COURSE_NOT_FOUND: "COURSE_NOT_FOUND",
  /** The requested state transition is not allowed (e.g. revoke an already revoked row). */
  INVALID_STATE: "INVALID_STATE",
  /** Malformed request body / query. */
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

export type CertificateErrorCode =
  (typeof CERTIFICATE_ERROR)[keyof typeof CERTIFICATE_ERROR];

export class CertificateError extends Error {
  code: CertificateErrorCode;
  status: number;

  constructor(
    code: CertificateErrorCode,
    message = "Unable to complete the certificate operation.",
    status = 500
  ) {
    super(message);
    this.name = "CertificateError";
    this.code = code;
    this.status = status;
  }
}

/** Human-friendly public message for a known error code. */
export function certificateUserMessage(error: unknown): string {
  if (error instanceof CertificateError) {
    switch (error.code) {
      case CERTIFICATE_ERROR.NOT_ELIGIBLE:
        return "This course is not yet complete, so a certificate cannot be issued.";
      case CERTIFICATE_ERROR.NOT_FOUND:
        return "Certificate not found.";
      case CERTIFICATE_ERROR.ACCESS_DENIED:
        return "You do not have access to this certificate.";
      case CERTIFICATE_ERROR.GENERATION_FAILED:
        return "We could not generate the certificate PDF. Please try again.";
      case CERTIFICATE_ERROR.STORAGE_FAILED:
        return "We could not save the certificate. Please try again.";
      case CERTIFICATE_ERROR.RATE_LIMITED:
        return "Too many requests. Please try again shortly.";
      case CERTIFICATE_ERROR.ALREADY_ISSUED:
        return "This certificate has already been issued.";
      case CERTIFICATE_ERROR.INVALID_IDENTIFIER:
        return "Please enter a valid certificate number or verification code.";
      case CERTIFICATE_ERROR.DUPLICATE_NUMBER:
        return "That certificate number is already in use. Choose a different one.";
      case CERTIFICATE_ERROR.INVALID_FILE:
        return "Please choose a valid certificate file to upload.";
      case CERTIFICATE_ERROR.INVALID_FILE_TYPE:
        return "Only PDF, JPG, JPEG and PNG files are allowed.";
      case CERTIFICATE_ERROR.FILE_TOO_LARGE:
        return "The selected file is too large. Please upload a smaller file.";
      case CERTIFICATE_ERROR.STUDENT_NOT_FOUND:
        return "The selected student could not be found.";
      case CERTIFICATE_ERROR.COURSE_NOT_FOUND:
        return "The selected course could not be found.";
      case CERTIFICATE_ERROR.INVALID_STATE:
        return "That action is not allowed for the certificate's current status.";
      case CERTIFICATE_ERROR.VALIDATION_FAILED:
        return "Please review the form and try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

/**
 * Maps a CertificateError to an HTTP JSON response. Non-certificate errors
 * collapse to a generic 500 and are logged server-side only.
 */
export function toCertificateErrorResponse(error: unknown): NextResponse {
  if (error instanceof CertificateError) {
    return NextResponse.json(
      { success: false, error: certificateUserMessage(error) },
      { status: error.status }
    );
  }
  console.error("Certificate error:", error instanceof Error ? error.message : error);
  return NextResponse.json(
    { success: false, error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}