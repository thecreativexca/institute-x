import { getBaseEmailLayout, getBaseEmailText } from "./base";
import type { PaymentConfirmedEmailData } from "@/lib/email/types";
import { siteConfig } from "@/lib/config/site";

export function renderPaymentConfirmedEmail(data: PaymentConfirmedEmailData): { html: string; text: string } {
  const { studentName, courseName, amount, currency, paymentDate, receiptNumber, paymentId, courseUrl, dashboardUrl } = data;

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px;">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Your payment for <strong>${escapeHtml(courseName)}</strong> was successful. Thank you for your purchase!
    </p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Course:</strong> ${escapeHtml(courseName)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Amount Paid:</strong> ${escapeHtml(amount)} ${escapeHtml(currency)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Payment Date:</strong> ${escapeHtml(paymentDate)}
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #166534;">
        <strong>Receipt:</strong> <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${escapeHtml(receiptNumber)}</code>
      </p>
      <p style="margin: 0; font-size: 14px; color: #166534;">
        <strong>Payment ID:</strong> <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${escapeHtml(paymentId)}</code>
      </p>
    </div>
    
    <p style="margin: 0 0 16px; font-size: 16px;">
      Your enrollment has been activated and you now have full access to all course materials.
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
    title: `Payment Successful — ${courseName}`,
    previewText: `Your payment for ${courseName} was successful. Your enrollment is now active.`,
    content,
    cta: {
      text: "Start Learning",
      url: courseUrl,
    },
    footerNote: `Receipt: ${receiptNumber} | Payment ID: ${paymentId} | View dashboard at ${dashboardUrl}`,
  });

  const text = getBaseEmailText({
    title: `Payment Successful — ${courseName}`,
    previewText: `Your payment for ${courseName} was successful. Your enrollment is now active.`,
    content: `
Hello ${studentName},

Your payment for ${courseName} was successful. Thank you for your purchase!

Course: ${courseName}
Amount Paid: ${amount} ${currency}
Payment Date: ${paymentDate}
Receipt: ${receiptNumber}
Payment ID: ${paymentId}

Your enrollment has been activated and you now have full access to all course materials.

Start Learning: ${courseUrl}

You can also access this course from your student dashboard: ${dashboardUrl}

Need help? Contact us at ${siteConfig.contact.email}
    `.trim(),
    cta: { text: "Start Learning", url: courseUrl },
    footerNote: `Receipt: ${receiptNumber} | Payment ID: ${paymentId} | View dashboard at ${dashboardUrl}`,
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