import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { WelcomeEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const { studentName, dashboardUrl, coursesUrl } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Welcome to ${escapeHtml(siteConfig.name)}! Your email has been verified and your account is now active.
    </p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      You're now ready to explore our courses and start learning practical skills for your professional career.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(coursesUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        Explore Courses
      </a>
    </div>
    
    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
      Your student dashboard is also available where you can track your progress, view enrolled courses, and manage your profile.
    </p>
  `;

  const html = getBaseEmailLayout({
    title: `Welcome to ${siteConfig.name}`,
    previewText: `Welcome to ${siteConfig.name}! Your account is now active. Explore courses and start learning.`,
    content,
    cta: {
      text: "Explore Courses",
      url: coursesUrl,
    },
    footerNote: "Your student dashboard is available at " + dashboardUrl,
  });

  const text = getBaseEmailText({
    title: `Welcome to ${siteConfig.name}`,
    previewText: `Welcome to ${siteConfig.name}! Your account is now active. Explore courses and start learning.`,
    content: `
Hello ${studentName},

Welcome to ${siteConfig.name}! Your email has been verified and your account is now active.

You're now ready to explore our courses and start learning practical skills for your professional career.

Explore Courses: ${coursesUrl}

Your student dashboard is also available where you can track your progress, view enrolled courses, and manage your profile: ${dashboardUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "Explore Courses", url: coursesUrl },
    footerNote: `Your student dashboard is available at ${dashboardUrl}`,
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