import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { SupportReplyEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderSupportReplyEmail(data: SupportReplyEmailData): { html: string; text: string } {
  const { studentName, studentEmail, ticketNumber, subject, replyMessage, replierName } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">You have received a reply on your support ticket.</p>
    
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #1e40af;"><strong>Ticket Number:</strong> ${escapeHtml(ticketNumber)}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #1e40af;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #1e40af;"><strong>Replied by:</strong> ${escapeHtml(replierName)}</p>
    </div>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #374151;">Reply:</p>
      <div style="font-size: 14px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(replyMessage)}</div>
    </div>
    
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      You can reply to this ticket by logging into your account.
    </p>
  `;

  const html = getBaseEmailLayout({
    title: `Reply on Support Ticket - ${ticketNumber}`,
    previewText: `New reply on your support ticket ${ticketNumber}`,
    content,
    footerNote: `Ticket: ${ticketNumber}. This is an automated message from ${siteConfig.name}.`,
  });

  const text = getBaseEmailText({
    title: `Reply on Support Ticket - ${ticketNumber}`,
    previewText: `New reply on your support ticket ${ticketNumber}`,
    content: `
Hello ${studentName},

You have received a reply on your support ticket.

Ticket Number: ${ticketNumber}
Subject: ${subject}
Replied by: ${replierName}

Reply:
${replyMessage}

You can reply to this ticket by logging into your account.

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    footerNote: `Ticket: ${ticketNumber}. This is an automated message from ${siteConfig.name}.`,
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