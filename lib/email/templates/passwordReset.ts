import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { PasswordResetEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderPasswordResetEmail(data: PasswordResetEmailData): { html: string; text: string } {
  const { studentName, resetUrl, expiryMinutes } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(resetUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        Reset Password
      </a>
    </div>
    
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      This link will expire in <strong>${expiryMinutes} minutes</strong>.
    </p>
    
    <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
      If you didn't request a password reset, please ignore this email or contact support if you have concerns.
    </p>
  `;

  const html = getBaseEmailLayout({
    title: "Reset Your Password",
    previewText: "We received a request to reset your password. Click the link below to create a new password.",
    content,
    cta: {
      text: "Reset Password",
      url: resetUrl,
    },
    footerNote: "For security, this link can only be used once and will expire.",
  });

  const text = getBaseEmailText({
    title: "Reset Your Password",
    previewText: "We received a request to reset your password. Click the link below to create a new password.",
    content: `
Hello ${studentName},

We received a request to reset your password. Click the link below to create a new password.

Reset your password: ${resetUrl}

This link will expire in ${expiryMinutes} minutes.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "Reset Password", url: resetUrl },
    footerNote: "For security, this link can only be used once and will expire.",
  });

  return { html, text };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "&#039;");
}