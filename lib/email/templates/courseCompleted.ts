import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { CourseCompletedEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderCourseCompletedEmail(data: CourseCompletedEmailData): { html: string; text: string } {
  const { studentName, courseName, completionDate, progressUrl, certificateStatus } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      🎉 Congratulations! You have successfully completed <strong>${escapeHtml(courseName)}</strong>!
    </p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #166534;">Course Completed</p>
      <p style="margin: 0; font-size: 16px; color: #166534;">${escapeHtml(courseName)}</p>
    </div>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
        <strong>Completion Date:</strong> ${escapeHtml(completionDate)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
        <strong>Certificate Status:</strong> ${escapeHtml(certificateStatus)}
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Your hard work and dedication have paid off. You've gained valuable knowledge and skills that will help you in your professional journey.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(progressUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        View Progress & Certificate
      </a>
    </div>
  `;

  const html = getBaseEmailLayout({
    title: `Congratulations — ${courseName} Completed!`,
    previewText: `Congratulations! You have successfully completed ${courseName}.`,
    content,
    cta: {
      text: "View Progress & Certificate",
      url: progressUrl,
    },
    footerNote: `Completed on ${completionDate}. Certificate status: ${certificateStatus}.`,
  });

  const text = getBaseEmailText({
    title: `Congratulations — ${courseName} Completed!`,
    previewText: `Congratulations! You have successfully completed ${courseName}.`,
    content: `
Hello ${studentName},

🎉 Congratulations! You have successfully completed ${courseName}!

Completion Date: ${completionDate}
Certificate Status: ${certificateStatus}

Your hard work and dedication have paid off. You've gained valuable knowledge and skills that will help you in your professional journey.

View Progress & Certificate: ${progressUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "View Progress & Certificate", url: progressUrl },
    footerNote: `Completed on ${completionDate}. Certificate status: ${certificateStatus}.`,
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