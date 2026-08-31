import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { AnnouncementEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderAnnouncementEmail(data: AnnouncementEmailData): { html: string; text: string } {
  const { studentName, announcementTitle, announcementBody, publishedAt, announcementUrl } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 24px 0;">
      <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #1e40af;">${escapeHtml(announcementTitle)}</h2>
      <div style="font-size: 16px; color: #1e3a8a; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(announcementBody)}</div>
    </div>
    
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      Published: ${escapeHtml(publishedAt)}
    </p>
    
    ${announcementUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(announcementUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        Read More
      </a>
    </div>
    ` : ""}
  `;

  const html = getBaseEmailLayout({
    title: announcementTitle,
    previewText: announcementBody.substring(0, 100) + (announcementBody.length > 100 ? "..." : ""),
    content,
    cta: announcementUrl ? {
      text: "Read More",
      url: announcementUrl,
    } : undefined,
    footerNote: `Published on ${publishedAt}. This announcement was sent to you as a student of ${siteConfig.name}.`,
  });

  const text = getBaseEmailText({
    title: announcementTitle,
    previewText: announcementBody.substring(0, 100) + (announcementBody.length > 100 ? "..." : ""),
    content: `
Hello ${studentName},

${announcementTitle}

${announcementBody}

Published: ${publishedAt}

${announcementUrl ? `Read More: ${announcementUrl}` : ""}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: announcementUrl ? { text: "Read More", url: announcementUrl } : undefined,
    footerNote: `Published on ${publishedAt}. This announcement was sent to you as a student of ${siteConfig.name}.`,
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