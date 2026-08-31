import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { EmailTemplateData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export interface AssignmentGradedEmailData extends EmailTemplateData {
  studentName: string;
  courseName: string;
  assignmentTitle: string;
  score?: string;
  maxScore?: string;
  feedbackUrl: string;
}

export function renderAssignmentGradedEmail(data: AssignmentGradedEmailData): { html: string; text: string } {
  const { studentName, courseName, assignmentTitle, score, maxScore, feedbackUrl } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Your assignment <strong>${escapeHtml(assignmentTitle)}</strong> has been graded.
    </p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Course:</strong> ${escapeHtml(courseName)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Assignment:</strong> ${escapeHtml(assignmentTitle)}
      </p>
      ${score && maxScore ? `
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>Score:</strong> ${escapeHtml(score)} / ${escapeHtml(maxScore)}
      </p>
      ` : ""}
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      You can view the detailed feedback and grading notes in your student portal.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(feedbackUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        View Feedback
      </a>
    </div>
  `;

  const html = getBaseEmailLayout({
    title: `Assignment Graded — ${assignmentTitle}`,
    previewText: `Your assignment "${assignmentTitle}" has been graded.`,
    content,
    cta: {
      text: "View Feedback",
      url: feedbackUrl,
    },
    footerNote: `Course: ${courseName}`,
  });

  const text = getBaseEmailText({
    title: `Assignment Graded — ${assignmentTitle}`,
    previewText: `Your assignment "${assignmentTitle}" has been graded.`,
    content: `
Hello ${studentName},

Your assignment ${assignmentTitle} has been graded.

Course: ${courseName}
Assignment: ${assignmentTitle}
${score && maxScore ? `Score: ${score} / ${maxScore}` : ""}

You can view the detailed feedback and grading notes in your student portal.

View Feedback: ${feedbackUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "View Feedback", url: feedbackUrl },
    footerNote: `Course: ${courseName}`,
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