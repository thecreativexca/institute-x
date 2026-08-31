import { siteConfig } from "@/lib/config/site";

export interface BaseEmailLayoutProps {
  title: string;
  previewText: string;
  content: string;
  footerNote?: string;
  cta?: {
    text: string;
    url: string;
  };
}

export function getBaseEmailLayout({
  title,
  previewText,
  content,
  footerNote,
  cta,
}: BaseEmailLayoutProps): string {
  const appUrl = siteConfig.url;
  const instituteName = siteConfig.name;
  const supportEmail = siteConfig.contact.email;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6;">
    <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f3f4f6;">
      ${escapeHtml(previewText)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="background-color: #2563eb; padding: 32px 24px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">
                  ${escapeHtml(instituteName)}
                </h1>
                <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 14px;">
                  ${escapeHtml(siteConfig.tagline)}
                </p>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 32px 24px;">
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 24px;" />
                
                <div style="color: #1f2937; font-size: 16px;">
                  ${content}
                </div>
                
                ${cta ? `
                <div style="text-align: center; margin: 32px 0;">
                  <a
                    href="${escapeHtml(cta.url)}"
                    style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px;"
                  >
                    ${escapeHtml(cta.text)}
                  </a>
                </div>
                ` : ""}
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #9ca3af; text-align: center;">
                  This is an automated transactional email from ${escapeHtml(instituteName)}.
                  ${footerNote ? escapeHtml(footerNote) : ""}
                </p>
                
                <p style="margin: 16px 0 0; font-size: 13px; color: #9ca3af; text-align: center;">
                  Need help? Contact us at
                  <a href="mailto:${escapeHtml(supportEmail)}" style="color: #2563eb; text-decoration: none;">
                    ${escapeHtml(supportEmail)}
                  </a>
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  &copy; ${currentYear} ${escapeHtml(instituteName)}. All rights reserved.
                </p>
                <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                  <a href="${escapeHtml(appUrl)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(appUrl)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

export function getBaseEmailText({
  title,
  previewText,
  content,
  footerNote,
  cta,
}: BaseEmailLayoutProps): string {
  const instituteName = siteConfig.name;
  const supportEmail = siteConfig.contact.email;
  const appUrl = siteConfig.url;

  let text = `${title}\n\n${previewText}\n\n`;
  text += stripHtml(content).trim();
  
  if (cta) {
    text += `\n\n${cta.text}: ${cta.url}`;
  }
  
  if (footerNote) {
    text += `\n\n${footerNote}`;
  }
  
  text += `\n\nNeed help? Contact us at ${supportEmail}`;
  text += `\n\n${instituteName} - ${appUrl}`;
  
  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "&#039;");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}