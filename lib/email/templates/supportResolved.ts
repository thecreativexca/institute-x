import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { SupportResolvedEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderSupportResolvedEmail(data: SupportResolvedEmailData): { html: string; text: string } {
  const { studentName, studentEmail, ticketNumber, subject } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">Your support ticket has been marked as resolved.</p>
    
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #065f46;"><strong>Ticket Number:</strong> ${escapeHtml(ticketNumber)}</p>
      <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    </div>
    
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      If you feel the issue is not fully resolved, you can reopen the ticket by logging into your account.
    </p>
  `;

  const html = getBaseEmailLayout({
    title: `Support Ticket Resolved - ${ticketNumber}`,
    previewText: `Your support ticket ${ticketNumber} has been resolved`,
    content,
    footerNote: `Ticket: ${ticketNumber}. If you need further assistance, please contact us at ${siteConfig.contact.email}.`,
  });

  const text = getBaseEmailText({
    title: `Support Ticket Resolved - ${ticketNumber}`,
    previewText: `Your support ticket ${ticketNumber} has been resolved`,
    content: `
Hello ${studentName},

Your support ticket has been marked as resolved.

Ticket Number: ${ticketNumber}
Subject: ${subject}

If you feel the issue is not fully resolved, you can reopen the ticket by logging into your account.

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    footerNote: `Ticket: ${ticketNumber}. If you need further assistance, please contact us at ${siteConfig.contact.email}.`,
  });

  return { html, text };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;")
    .replace(/'/g, "&#039;");
}