import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { EmailTemplateData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export interface QuizCompletedEmailData extends EmailTemplateData {
  studentName: string;
  courseName: string;
  quizTitle: string;
  score?: string;
  maxScore?: string;
  percentage?: string;
  passed?: boolean;
  resultUrl: string;
  showResult: boolean;
}

export function renderQuizCompletedEmail(data: QuizCompletedEmailData): { html: string; text: string } {
  const { studentName, courseName, quizTitle, score, maxScore, percentage, passed = false, resultUrl, showResult } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      You have completed the quiz <strong>${escapeHtml(quizTitle)}</strong>.
    </p>
    
    <div style="background-color: ${passed ? "#f0fdf4" : "#fef2f2"}; border: 1px solid ${passed ? "#bbf7d0" : "#fecaca"}; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: ${passed ? "#166534" : "#991b1b"};">
        <strong>Course:</strong> ${escapeHtml(courseName)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: ${passed ? "#166534" : "#991b1b"};">
        <strong>Quiz:</strong> ${escapeHtml(quizTitle)}
      </p>
      ${showResult && score && maxScore ? `
      <p style="margin: 0 0 8px; font-size: 14px; color: ${passed ? "#166534" : "#991b1b"};">
        <strong>Score:</strong> ${escapeHtml(score)} / ${escapeHtml(maxScore)} (${escapeHtml(percentage ?? "")}%)
      </p>
      <p style="margin: 0; font-size: 14px; color: ${passed ? "#166534" : "#991b1b"};">
        <strong>Status:</strong> ${passed ? "Passed" : "Not Passed"}
      </p>
      ` : `
      <p style="margin: 0; font-size: 14px; color: ${passed ? "#166534" : "#991b1b"};">
        <strong>Status:</strong> ${passed ? "Passed" : "Not Passed"}
      </p>
      `}
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      ${showResult ? "You can view the detailed results and explanations in your student portal." : "Results will be available once the instructor reviews the quiz."}
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(resultUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        View Results
      </a>
    </div>
  `;

  const html = getBaseEmailLayout({
    title: `Quiz Completed — ${quizTitle}`,
    previewText: `You have completed the quiz "${quizTitle}". ${showResult ? `Score: ${score}/${maxScore} (${percentage ?? ""}%)` : "Results will be available soon."}`,
    content,
    cta: {
      text: "View Results",
      url: resultUrl,
    },
    footerNote: `Course: ${courseName}`,
  });

  const text = getBaseEmailText({
    title: `Quiz Completed — ${quizTitle}`,
    previewText: `You have completed the quiz "${quizTitle}". ${showResult ? `Score: ${score}/${maxScore} (${percentage ?? ""}%)` : "Results will be available soon."}`,
    content: `
Hello ${studentName},

You have completed the quiz ${quizTitle}.

Course: ${courseName}
Quiz: ${quizTitle}
${showResult && score && maxScore ? `Score: ${score} / ${maxScore} (${percentage ?? ""}%)` : ""}
Status: ${passed ? "Passed" : "Not Passed"}

${showResult ? "You can view the detailed results and explanations in your student portal." : "Results will be available once the instructor reviews the quiz."}

View Results: ${resultUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "View Results", url: resultUrl },
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