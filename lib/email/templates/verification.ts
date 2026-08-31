import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { VerificationEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderVerificationEmail(data: VerificationEmailData): { html: string; text: string } {
  const { studentName, verificationUrl, expiryHours } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Welcome to ${escapeHtml(siteConfig.name)}! Please verify your email address to activate your student account.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(verificationUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        Verify Email Address
      </a>
    </div>
    
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      This link will expire in <strong>${expiryHours} hours</strong>.
    </p>
    
    <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
      If you didn't create an account with us, please ignore this email.
    </p>
  `;

  const html = getBaseEmailLayout({
    title: "Verify Your Email Address",
    previewText: `Welcome to ${siteConfig.name}! Please verify your email address to activate your account.`,
    content,
    cta: {
      text: "Verify Email Address",
      url: verificationUrl,
    },
    footerNote: "This verification link is unique to you and should not be shared.",
  });

  const text = getBaseEmailText({
    title: "Verify Your Email Address",
    previewText: `Welcome to ${siteConfig.name}! Please verify your email address to activate your account.`,
    content: `
Hello ${studentName},

Welcome to ${siteConfig.name}! Please verify your email address to activate your student account.

Verify your email: ${verificationUrl}

This link will expire in ${expiryHours} hours.

If you didn't create an account with us, please ignore this email.

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "Verify Email Address", url: verificationUrl },
    footerNote: "This verification link is unique to you and should not be shared.",
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