import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getResendClient, getResendFromEmail, getResendFromName } from "./client";
import { env } from "@/lib/config/env";
import {
  createEmailLog,
  updateEmailLog,
  getEmailLogById,
  type EmailEventKey,
  EMAIL_EVENTS,
} from "./logging";
import {
  type SendEmailOptions,
  type SendEmailResult,
} from "./types";
import {
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderWelcomeEmail,
  renderEnrollmentConfirmedEmail,
  renderPaymentConfirmedEmail,
  renderAssignmentSubmittedEmail,
  renderAssignmentGradedEmail,
  renderQuizCompletedEmail,
  renderCourseCompletedEmail,
  renderCertificateIssuedEmail,
  renderAnnouncementEmail,
} from "./templates";

type TemplateRenderer = (data: Record<string, unknown>) => { html: string; text: string };

const TEMPLATE_RENDERERS: Record<EmailEventKey, TemplateRenderer> = {
  [EMAIL_EVENTS.EMAIL_VERIFICATION]: renderVerificationEmail as TemplateRenderer,
  [EMAIL_EVENTS.PASSWORD_RESET]: renderPasswordResetEmail as TemplateRenderer,
  [EMAIL_EVENTS.WELCOME]: renderWelcomeEmail as TemplateRenderer,
  [EMAIL_EVENTS.ENROLLMENT_CONFIRMED]: renderEnrollmentConfirmedEmail as TemplateRenderer,
  [EMAIL_EVENTS.PAYMENT_CONFIRMED]: renderPaymentConfirmedEmail as TemplateRenderer,
  [EMAIL_EVENTS.ASSIGNMENT_SUBMITTED]: renderAssignmentSubmittedEmail as TemplateRenderer,
  [EMAIL_EVENTS.ASSIGNMENT_GRADED]: renderAssignmentGradedEmail as TemplateRenderer,
  [EMAIL_EVENTS.QUIZ_COMPLETED]: renderQuizCompletedEmail as TemplateRenderer,
  [EMAIL_EVENTS.COURSE_COMPLETED]: renderCourseCompletedEmail as TemplateRenderer,
  [EMAIL_EVENTS.CERTIFICATE_ISSUED]: renderCertificateIssuedEmail as TemplateRenderer,
  [EMAIL_EVENTS.ANNOUNCEMENT]: renderAnnouncementEmail as TemplateRenderer,
};

/* -------------------------------------------------------------------------- */
/*  SMTP transport (lazily created, reused across requests)                   */
/* -------------------------------------------------------------------------- */

let smtpTransport: Transporter | null = null;

function getSmtpTransport(): Transporter {
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, // true for 465 (SSL), STARTTLS for 587
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return smtpTransport;
}

/* -------------------------------------------------------------------------- */
/*  Unified dispatch — SMTP when configured, Resend otherwise                 */
/* -------------------------------------------------------------------------- */

async function dispatchEmail(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ providerId?: string; error?: string }> {
  /* -- SMTP path (local dev / any-email testing) --------------------------- */
  if (env.smtpConfigured) {
    try {
      const transport = getSmtpTransport();
      const info = await transport.sendMail({
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
      console.log(`[SMTP] Email sent to ${opts.to} — messageId: ${info.messageId}`);
      return { providerId: info.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "SMTP error";
      console.error("[SMTP] Send failed:", message);
      return { error: message };
    }
  }

  /* -- Resend path (production) ------------------------------------------- */
  const resend = getResendClient();
  const result = await resend.emails.send({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (result.error) {
    console.error(
      "[Resend API Error]:",
      JSON.stringify(
        { status: result.error.statusCode ?? 500, error: result.error, path: "/emails" },
        null,
        2
      )
    );
    return { error: result.error.message };
  }

  return { providerId: result.data?.id };
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function sendTransactionalEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  // Check if email is enabled
  if (!env.emailEnabled) {
    console.log("Email delivery disabled (EMAIL_ENABLED=false)");
    return { success: false, errorCode: "DISABLED", errorMessage: "Email delivery disabled" };
  }

  // Validate recipient
  if (!options.to || !isValidEmail(options.to)) {
    return { success: false, errorCode: "INVALID_RECIPIENT", errorMessage: "Invalid recipient email" };
  }

  // Create/reserve email log with idempotency
  const { logId, isDuplicate } = await createEmailLog({
    eventKey: options.eventKey,
    recipient: options.to,
    recipientUserId: options.recipientUserId,
    template: options.template,
    subject: options.subject,
    idempotencyKey: options.idempotencyKey,
    relatedEntityType: options.relatedEntityType,
    relatedEntityId: options.relatedEntityId,
    metadata: options.metadata,
  });

  // If duplicate and already sent, skip
  if (isDuplicate) {
    const existingLog = await getEmailLogById(logId);
    if (existingLog?.status === "sent") {
      console.log(`Email already sent (idempotent): ${options.idempotencyKey}`);
      return { success: true, logId, providerMessageId: existingLog.providerMessageId };
    }
    // If failed or pending, allow retry
  }

  try {
    // Render template
    const renderer = TEMPLATE_RENDERERS[options.eventKey];
    if (!renderer) {
      throw new Error(`No template renderer for event: ${options.eventKey}`);
    }

    const { html, text } = renderer(options.metadata ?? {});

    // Pick sender identity based on transport
    const fromEmail = env.smtpConfigured
      ? (env.smtpUser ?? "")
      : getResendFromEmail();
    const fromName = env.smtpConfigured
      ? (env.smtpUser ?? "")
      : getResendFromName();

    const { providerId, error } = await dispatchEmail({
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html,
      text,
    });

    if (error) {
      await updateEmailLog(logId, {
        status: "failed",
        errorCode: "PROVIDER_ERROR",
        errorMessageSafe: error.substring(0, 500),
      });
      return {
        success: false,
        logId,
        errorCode: "PROVIDER_ERROR",
        errorMessage: error,
      };
    }

    await updateEmailLog(logId, {
      status: "sent",
      providerMessageId: providerId,
    });

    return {
      success: true,
      logId,
      providerMessageId: providerId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await updateEmailLog(logId, {
      status: "failed",
      errorCode: "SEND_FAILED",
      errorMessageSafe: errorMessage.substring(0, 500),
    });
    return {
      success: false,
      logId,
      errorCode: "SEND_FAILED",
      errorMessage,
    };
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Re-export for convenience
export {
  generateIdempotencyKey,
  EMAIL_EVENTS,
  type EmailEventKey,
} from "./logging";