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