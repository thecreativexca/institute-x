import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { PasswordResetEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderPasswordResetEmail(data: PasswordResetEmailData): { html: string; text: string } {
  const { studentName, otp, expiryMinutes } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      We received a request to reset your password. Enter this one-time password on the verification screen.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; background-color: #eff6ff; color: #1e3a8a; font-weight: 700; padding: 14px 28px; border-radius: 8px; letter-spacing: 8px; font-size: 28px;">
        ${escapeHtml(otp)}
      </span>
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
    previewText: `Your password reset OTP is ${otp}.`,
    content,
    footerNote: "For security, this OTP can only be used once and will expire.",
  });

  const text = getBaseEmailText({
    title: "Reset Your Password",
    previewText: `Your password reset OTP is ${otp}.`,
    content: `
Hello ${studentName},

We received a request to reset your password.

Your password reset OTP is: ${otp}

This link will expire in ${expiryMinutes} minutes.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    footerNote: "For security, this OTP can only be used once and will expire.",
  });

  return { html, text };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
