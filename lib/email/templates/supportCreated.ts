import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { SupportCreatedEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderSupportCreatedEmail(data: SupportCreatedEmailData): { html: string; text: string } {
  const { studentName, studentEmail, ticketNumber, subject } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">Your support ticket has been created successfully.</p>
    
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #1e40af;"><strong>Ticket Number:</strong> ${escapeHtml(ticketNumber)}</p>
      <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    </div>
    
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      Our support team will review your ticket and get back to you soon.
    </p>
  `;

  const html = getBaseEmailLayout({
    title: `Support Ticket Created - ${ticketNumber}`,
    previewText: `Your support ticket ${ticketNumber} has been created`,
    content,
    footerNote: `Ticket: ${ticketNumber}. If you didn't create this ticket, please contact support at ${siteConfig.contact.email}.`,
  });

  const text = getBaseEmailText({
    title: `Support Ticket Created - ${ticketNumber}`,
    previewText: `Your support ticket ${ticketNumber} has been created`,
    content: `
Hello ${studentName},

Your support ticket has been created successfully.

Ticket Number: ${ticketNumber}
Subject: ${subject}

Our support team will review your ticket and get back to you soon.

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    footerNote: `Ticket: ${ticketNumber}. If you didn't create this ticket, please contact support at ${siteConfig.contact.email}.`,
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