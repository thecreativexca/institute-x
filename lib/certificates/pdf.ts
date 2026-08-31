import "server-only";

import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import { siteConfig } from "@/lib/config/site";

/**
 * Server-side certificate PDF generator (spec §15, §20, §64–§66).
 *
 * - Landscape A4, built with pdfkit (pure Node — no headless browser), so it
 *   runs reliably in the deployment environment.
 * - Uses Helvetica (a non-embedded standard PDF font), which is safe anywhere
 *   and keeps text selectable (§65).
 * - The QR code points only to the public verification URL (§33–§34).
 * - Logo/signature/seal are embedded ONLY when a configured raster URL is
 *   available; otherwise the certificate renders a clean text wordmark and
 *   omits any fake signature (§18, §62, §63).
 */

export interface CertificatePdfInput {
  studentName: string;
  courseName: string;
  completionDate: Date;
  issuedAt: Date;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
}

/** Deterministic, unambiguous date like "29 August 2026" (spec §66). */
export function formatCertificateDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const PAGE_W = 841.89; // A4 landscape width (points)
const PAGE_H = 595.28; // A4 landscape height (points)

/** Fetches a remote raster image (PNG/JPEG) for optional logo/signature. */
async function loadRasterImage(
  url: string,
  maxBytes = 3 * 1024 * 1024
): Promise<Buffer | null> {
  try {
    if (!/^https?:\/\//i.test(url)) return null;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/^image\/(png|jpe?g)/i.test(type)) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > maxBytes) return null;
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

/**
 * Generates an immutable certificate PDF and returns it as a Buffer.
 * Throws on failure so the caller can compensate (no broken records).
 */
export async function generateCertificatePdf(
  input: CertificatePdfInput
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,
    info: {
      Title: `Certificate — ${input.courseName}`,
      Author: siteConfig.name,
      Subject: `Certificate of Completion — ${input.certificateNumber}`,
    },
    autoFirstPage: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
// ----- Outer decorative frame -----
  doc.rect(28, 28, PAGE_W - 56, PAGE_H - 56).lineWidth(2.5).stroke("#1e3a5f");
  doc
    .rect(34, 34, PAGE_W - 68, PAGE_H - 68)
    .lineWidth(0.75)
    .stroke("#b45309");
  doc
    .rect(40, 40, PAGE_W - 80, PAGE_H - 80)
    .lineWidth(1.25)
    .stroke("#1e3a5f");

  const innerX = 40;
  const innerY = 40;
  const innerW = PAGE_W - 80;
  const innerH = PAGE_H - 80;

  const inky = "#1e3a5f";
  const slate = "#475569";
  const gold = "#b45309";

  // ----- Branding (wordmark / optional logo) -----
  const wordmarkY = 64;

  const logo = await loadRasterImage(siteConfig.certificate.logoImageUrl ?? "");
  if (logo) {
    const logoSz = 54;
    try {
      doc.image(logo, (PAGE_W - logoSz) / 2, wordmarkY, {
        width: logoSz,
        height: logoSz,
        fit: [logoSz, logoSz],
      });
    } catch {
      // Fall through to the text wordmark below.
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(inky)
    .text(siteConfig.name, innerX, wordmarkY + (logo ? 60 : 0), {
      width: innerW,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(slate)
    .text(siteConfig.tagline, innerX, wordmarkY + (logo ? 82 : 24), {
      width: innerW,
      align: "center",
    });

  // Divider
  doc
    .moveTo(PAGE_W / 2 - 110, wordmarkY + (logo ? 106 : 50))
    .lineTo(PAGE_W / 2 + 110, wordmarkY + (logo ? 106 : 50))
    .lineWidth(1)
    .stroke(gold);

  // ----- Heading -----
  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor(gold)
    .text(siteConfig.certificate.heading, innerX, wordmarkY + (logo ? 118 : 62), {
      width: innerW,
      align: "center",
    });

  // ----- "This is to certify that" -----
  const certifyY = wordmarkY + (logo ? 158 : 102);
  doc
    .font("Helvetica")
    .fontSize(12.5)
    .fillColor(slate)
    .text("This is to certify that", innerX, certifyY, {
      width: innerW,
      align: "center",
    });

  // ----- Student name -----
  const studentY = certifyY + 34;
  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(inky)
    .text(input.studentName, innerX, studentY, {
      width: innerW,
      align: "center",
    });

  // ----- Completion statement with course name -----
  const statement = siteConfig.certificate.statement
    .replace("{studentName}", input.studentName)
    .replace("{courseName}", input.courseName);

  const statementY = studentY + 54;
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(slate)
    .text(statement, innerX, statementY, {
      width: Math.min(innerW, 620),
      align: "center",
      lineBreak: true,
    });
// ----- Dates row -----
  const datesY = statementY + 66;
  const dateColWidth = innerW / 2 - 30;
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(inky)
    .text("COMPLETED ON", innerX + 50, datesY, { width: dateColWidth, align: "left" });
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(slate)
    .text(formatCertificateDate(input.completionDate), innerX + 50, datesY + 18, {
      width: dateColWidth,
      align: "left",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(inky)
    .text("ISSUED ON", PAGE_W - 50 - dateColWidth, datesY, {
      width: dateColWidth,
      align: "right",
    });
  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(slate)
    .text(formatCertificateDate(input.issuedAt), PAGE_W - 50 - dateColWidth, datesY + 18, {
      width: dateColWidth,
      align: "right",
    });

  // ----- Signatory + QR + footer -----
  const footerY = innerY + innerH - 120;

  // Left: signatory area
  const signRect = { x: innerX + 70, y: footerY - 26, w: 230, h: 70 };
  const signature = await loadRasterImage(siteConfig.certificate.signatureImageUrl ?? "");
  if (signature) {
    try {
      doc.image(signature, signRect.x + 40, signRect.y, {
        width: 150,
        height: 40,
        fit: [150, 40],
      });
    } catch {
      /* no fake signature */
    }
  }
  doc
    .moveTo(signRect.x, signRect.y + 44)
    .lineTo(signRect.x + signRect.w, signRect.y + 44)
    .lineWidth(1)
    .stroke(slate);
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(inky)
    .text(siteConfig.certificate.signatory.name, signRect.x, signRect.y + 48, {
      width: signRect.w,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(slate)
    .text(siteConfig.certificate.signatory.designation, signRect.x, signRect.y + 66, {
      width: signRect.w,
      align: "center",
    });

  // Center-right: verification code + number
  const infoX = PAGE_W / 2 - 60;
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(inky)
    .text("CERTIFICATE NO.", infoX, footerY - 30, { width: 240, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(slate)
    .text(input.certificateNumber, infoX, footerY - 14, { width: 240, align: "center" });
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(inky)
    .text("VERIFICATION CODE", infoX, footerY + 8, { width: 240, align: "center" });
  doc
    .font("Courier-Bold")
    .fontSize(13)
    .fillColor(slate)
    .text(input.verificationCode, infoX, footerY + 24, { width: 240, align: "center" });

  // Right: QR code
  const qrSize = 92;
  const qrX = innerX + innerW - qrSize - 56;
  const qrY = footerY - 38;
  let qrBuffer: Buffer | null = null;
  try {
    qrBuffer = await QRCode.toBuffer(input.verificationUrl, {
      type: "png",
      width: qrSize * 4,
      margin: 0,
      errorCorrectionLevel: "M",
    });
  } catch {
    qrBuffer = null;
  }
  if (qrBuffer) {
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(slate)
      .text("Scan to verify", qrX, qrY + qrSize + 4, { width: qrSize, align: "center" });
  }

  // Footer note
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(slate)
    .text(
      siteConfig.certificate.footerNote,
      innerX,
      innerY + innerH - 34,
      { width: innerW, align: "center" }
    );

  doc.end();
  return completed;
}