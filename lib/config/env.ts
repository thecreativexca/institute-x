/**
 * Server-only environment access.
 *
 * Import this module ONLY from server code (route handlers, server actions,
 * server components). It throws early with a clear message when a required
 * variable is missing instead of failing silently at runtime.
 *
 * Never import this file from a client component.
 */

import { DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB } from "@/lib/constants";

function readEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${key}". ` +
        `Copy .env.local.example to .env.local and fill in real values.`
    );
  }
  return value;
}

/** MongoDB connection string (server-only). */
export function getMongoDbUri(): string {
  return readEnv("MONGODB_URI");
}

/** Resend API key (server-only). */
export function getResendApiKey(): string {
  return readEnv("RESEND_API_KEY");
}

/** Resend from email (server-only). */
export function getResendFromEmail(): string {
  return readEnv("RESEND_FROM_EMAIL");
}

/** Resend from name (server-only, optional). */
export function getResendFromName(): string {
  const value = process.env.RESEND_FROM_NAME;
  return value && value.trim() !== "" ? value.trim() : "Creative X Tycoon";
}

/** Whether email delivery is enabled (useful for dev/test). */
export function getEmailEnabled(): boolean {
  const raw = process.env.EMAIL_ENABLED;
  if (raw === undefined) return true;
  return raw === "true";
}

/* --------------------------------- SMTP ----------------------------------- */
/** Optional SMTP host — when set, SMTP is used instead of Resend. */
export function getSmtpHost(): string | undefined {
  const v = process.env.SMTP_HOST;
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/** SMTP port (default 587). */
export function getSmtpPort(): number {
  const raw = process.env.SMTP_PORT;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
}

/** SMTP username (Gmail address). */
export function getSmtpUser(): string | undefined {
  const v = process.env.SMTP_USER;
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/** SMTP password / app-password. */
export function getSmtpPass(): string | undefined {
  const v = process.env.SMTP_PASS;
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/** Whether SMTP is fully configured and should be used. */
export function isSmtpConfigured(): boolean {
  return Boolean(getSmtpHost() && getSmtpUser() && getSmtpPass());
}

/* ------------------------------- Cloudinary ------------------------------- */
/**
 * Cloudinary credentials (server-only).
 * The API secret must never be prefixed with NEXT_PUBLIC_ or read in a
 * client component — see lib/resources/cloudinary.ts for the only consumer.
 */
export function getCloudinaryCloudName(): string {
  return readEnv("CLOUDINARY_CLOUD_NAME");
}

export function getCloudinaryApiKey(): string {
  return readEnv("CLOUDINARY_API_KEY");
}

export function getCloudinaryApiSecret(): string {
  return readEnv("CLOUDINARY_API_SECRET");
}

/* -------------------------------- Razorpay -------------------------------- */
/** Razorpay key ID (public, safe for client). */
export function getRazorpayKeyId(): string {
  return readEnv("RAZORPAY_KEY_ID");
}

/** Razorpay key secret (SERVER-ONLY — SECRET). Never import in client code. */
export function getRazorpayKeySecret(): string {
  return readEnv("RAZORPAY_KEY_SECRET");
}

/** Razorpay webhook secret (SERVER-ONLY — SECRET). */
export function getRazorpayWebhookSecret(): string {
  return readEnv("RAZORPAY_WEBHOOK_SECRET");
}

/** Optional override for the max resource upload size (in MB). Default: 25. */
export function getMaxResourceFileSizeMB(): number {
  const raw = process.env.MAX_RESOURCE_FILE_SIZE_MB;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 25;
}

/**
 * Optional override for the max admin certificate upload size (in MB).
 * Default: 10 (see DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB).
 */
export function getMaxCertificateFileSizeMB(): number {
  const raw = process.env.MAX_CERTIFICATE_FILE_SIZE_MB;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_CERTIFICATE_FILE_SIZE_MB;
}

export const env = {
  get mongoDbUri() {
    return getMongoDbUri();
  },
  get resendApiKey() {
    return getResendApiKey();
  },
  get resendFromEmail() {
    return getResendFromEmail();
  },
  get resendFromName() {
    return getResendFromName();
  },
  get emailEnabled() {
    return getEmailEnabled();
  },
  get smtpHost() {
    return getSmtpHost();
  },
  get smtpPort() {
    return getSmtpPort();
  },
  get smtpUser() {
    return getSmtpUser();
  },
  get smtpPass() {
    return getSmtpPass();
  },
  get smtpConfigured() {
    return isSmtpConfigured();
  },
  get cloudinaryCloudName() {
    return getCloudinaryCloudName();
  },
  get cloudinaryApiKey() {
    return getCloudinaryApiKey();
  },
  get cloudinaryApiSecret() {
    return getCloudinaryApiSecret();
  },
  get razorpayKeyId() {
    return getRazorpayKeyId();
  },
  get razorpayKeySecret() {
    return getRazorpayKeySecret();
  },
  get razorpayWebhookSecret() {
    return getRazorpayWebhookSecret();
  },
  get maxResourceFileSizeMB() {
    return getMaxResourceFileSizeMB();
  },
  get maxResourceFileSizeBytes() {
    return getMaxResourceFileSizeMB() * 1024 * 1024;
  },
  get maxCertificateFileSizeMB() {
    return getMaxCertificateFileSizeMB();
  },
  get maxCertificateFileSizeBytes() {
    return getMaxCertificateFileSizeMB() * 1024 * 1024;
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
} as const;
