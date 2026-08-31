import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { CertificateIssuedEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderCertificateIssuedEmail(data: CertificateIssuedEmailData): { html: string; text: string } {
  const { studentName, courseName, certificateNumber, issuedDate, certificateUrl, verificationUrl } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      🎓 Your certificate for <strong>${escapeHtml(courseName)}</strong> is ready!
    </p>
    
    <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">
        <strong>Certificate Number:</strong>
      </p>
      <p style="margin: 0; font-size: 20px; font-weight: 700; color: #92400e; font-family: monospace; letter-spacing: 0.05em;">
        ${escapeHtml(certificateNumber)}
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
        <strong>Course:</strong> ${escapeHtml(courseName)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
        <strong>Issued:</strong> ${escapeHtml(issuedDate)}
      </p>
      <p style="margin: 0; font-size: 14px; color: #374151;">
        <strong>Student:</strong> ${escapeHtml(studentName)}
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      This certificate verifies your successful completion of the course. You can download it, share it on professional networks, and anyone can verify its authenticity using the verification link below.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a
        href="${escapeHtml(certificateUrl)}"
        style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px; margin-right: 12px;"
      >
        View Certificate
      </a>
      <a
        href="${escapeHtml(verificationUrl)}"
        style="display: inline-block; background-color: #6b7280; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
      >
        Verify Online
      </a>
    </div>
  `;

  const html = getBaseEmailLayout({
    title: `Your Certificate Is Ready — ${courseName}`,
    previewText: `Your certificate for ${courseName} is ready. Certificate number: ${certificateNumber}`,
    content,
    cta: {
      text: "View Certificate",
      url: certificateUrl,
    },
    footerNote: `Certificate No: ${certificateNumber} | Issued: ${issuedDate} | Verify at ${verificationUrl}`,
  });

  const text = getBaseEmailText({
    title: `Your Certificate Is Ready — ${courseName}`,
    previewText: `Your certificate for ${courseName} is ready. Certificate number: ${certificateNumber}`,
    content: `
Hello ${studentName},

🎓 Your certificate for ${courseName} is ready!

Certificate Number: ${certificateNumber}
Course: ${courseName}
Issued: ${issuedDate}
Student: ${studentName}

This certificate verifies your successful completion of the course. You can download it, share it on professional networks, and anyone can verify its authenticity.

View Certificate: ${certificateUrl}
Verify Online: ${verificationUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "View Certificate", url: certificateUrl },
    footerNote: `Certificate No: ${certificateNumber} | Issued: ${issuedDate} | Verify at ${verificationUrl}`,
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