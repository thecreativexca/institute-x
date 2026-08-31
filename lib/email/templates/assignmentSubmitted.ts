import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { AssignmentSubmittedEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderAssignmentSubmittedEmail(data: AssignmentSubmittedEmailData): { html: string; text: string } {
  const { studentName, courseName, assignmentTitle, submissionNumber, submissionTime, submissionUrl } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Your assignment has been submitted successfully.
    </p>
    
    <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">
        <strong>Course:</strong> ${escapeHtml(courseName)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">
        <strong>Assignment:</strong> ${escapeHtml(assignmentTitle)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">
        <strong>Submission #:</strong> ${submissionNumber}
      </p>
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Submitted:</strong> ${escapeHtml(submissionTime)}
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Your submission has been received and will be reviewed by your instructor. You'll be notified once it's graded.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(submissionUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        View Submission
      </a>
    </div>
  `;

  const html = getBaseEmailLayout({
    title: `Assignment Submitted — ${assignmentTitle}`,
    previewText: `Your assignment "${assignmentTitle}" has been submitted successfully.`,
    content,
    cta: {
      text: "View Submission",
      url: submissionUrl,
    },
    footerNote: `Submitted on ${submissionTime}. You'll be notified when grading is complete.`,
  });

  const text = getBaseEmailText({
    title: `Assignment Submitted — ${assignmentTitle}`,
    previewText: `Your assignment "${assignmentTitle}" has been submitted successfully.`,
    content: `
Hello ${studentName},

Your assignment has been submitted successfully.

Course: ${courseName}
Assignment: ${assignmentTitle}
Submission #: ${submissionNumber}
Submitted: ${submissionTime}

Your submission has been received and will be reviewed by your instructor. You'll be notified once it's graded.

View Submission: ${submissionUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "View Submission", url: submissionUrl },
    footerNote: `Submitted on ${submissionTime}. You'll be notified when grading is complete.`,
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