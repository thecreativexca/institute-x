import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { EnrollmentConfirmedEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderEnrollmentConfirmedEmail(data: EnrollmentConfirmedEmailData): { html: string; text: string } {
  const { studentName, courseName, enrollmentDate, courseUrl, dashboardUrl, amount, currency } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Your enrollment in <strong>${escapeHtml(courseName)}</strong> has been confirmed!
    </p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Course:</strong> ${escapeHtml(courseName)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Enrollment Date:</strong> ${escapeHtml(enrollmentDate)}
      </p>
      ${amount && currency ? `
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>Amount Paid:</strong> ${escapeHtml(amount)} ${escapeHtml(currency)}
      </p>
      ` : ""}
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      You now have full access to all course materials including video lessons, downloadable resources, assignments, and quizzes.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(courseUrl)}"
        style="display: inline-block; background-color: #16a34a; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        Start Learning
      </a>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
      You can also access this course from your student dashboard.
    </p>
  `;

  const html = getBaseEmailLayout({
    title: `Enrollment Confirmed \u2014 ${courseName}`,
    previewText: `Your enrollment in ${courseName} has been confirmed. Start learning now!`,
    content,
    cta: {
      text: "Start Learning",
      url: courseUrl,
    },
    footerNote: `Enrolled on ${enrollmentDate}. Access your dashboard at ${dashboardUrl}.`,
  });

  const text = getBaseEmailText({
    title: `Enrollment Confirmed \u2014 ${courseName}`,
    previewText: `Your enrollment in ${courseName} has been confirmed. Start learning now!`,
    content: `
Hello ${studentName},

Your enrollment in ${courseName} has been confirmed!

Course: ${courseName}
Enrollment Date: ${enrollmentDate}
${amount && currency ? `Amount Paid: ${amount} ${currency}` : ""}

You now have full access to all course materials including video lessons, downloadable resources, assignments, and quizzes.

Start Learning: ${courseUrl}

You can also access this course from your student dashboard: ${dashboardUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "Start Learning", url: courseUrl },
    footerNote: `Enrolled on ${enrollmentDate}. Access your dashboard at ${dashboardUrl}.`,
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