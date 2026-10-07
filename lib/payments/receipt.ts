import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";

import { siteConfig } from "@/lib/config/site";
import { formatCurrency } from "./format";

export interface ReceiptPdfInput {
  receiptNumber: string;
  studentName: string;
  studentId: string;
  courseName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: Date;
  reference: string | null;
  totalFee: number;
  totalPaid: number;
  remainingAmount: number;
  paymentStatus: string;
  generatedAt: Date;
  isRefund: boolean;
}

export async function generatePaymentReceiptPdf(input: ReceiptPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Receipt ${input.receiptNumber}`, Author: siteConfig.name } });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  try {
    const logoPath = path.join(process.cwd(), "public", siteConfig.logo.replace(/^\//, ""));
    const logo = await readFile(logoPath);
    doc.image(logo, 48, 42, { fit: [56, 56] });
  } catch { /* Text branding remains when no local raster logo is available. */ }
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#103a50").text(siteConfig.name, 118, 48);
  doc.font("Helvetica").fontSize(10).fillColor("#64748b").text(siteConfig.contact.address, 118, 76, { width: 400 });
  doc.moveTo(48, 116).lineTo(547, 116).strokeColor("#cbd5e1").stroke();
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#0f172a").text(input.isRefund ? "Refund Receipt" : "Payment Receipt", 48, 138);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#475569").text(input.receiptNumber, 390, 142, { width: 157, align: "right" });
  let y = 190;
  const rows: Array<[string, string]> = [
    ["Student", input.studentName], ["Student ID", input.studentId], ["Course", input.courseName],
    [input.isRefund ? "Refund amount" : "Payment amount", formatCurrency(input.amount, input.currency)],
    ["Payment method", label(input.paymentMethod)], ["Payment date", formatDate(input.paymentDate)],
    ["Reference", input.reference ?? "—"], ["Total course fee", formatCurrency(input.totalFee, input.currency)],
    ["Total paid", formatCurrency(input.totalPaid, input.currency)], ["Remaining balance", formatCurrency(input.remainingAmount, input.currency)],
    ["Payment status", label(input.paymentStatus)], ["Receipt generated", formatDate(input.generatedAt)],
  ];
  for (const [key, value] of rows) {
    doc.rect(48, y - 5, 499, 28).fill(y % 56 === 22 ? "#f8fafc" : "#ffffff");
    doc.font("Helvetica").fontSize(10).fillColor("#64748b").text(key, 58, y + 3, { width: 170 });
    doc.font("Helvetica-Bold").fillColor("#0f172a").text(value, 230, y + 3, { width: 305, align: "right" });
    y += 28;
  }
  y += 34;
  doc.moveTo(350, y).lineTo(535, y).strokeColor("#94a3b8").stroke();
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Admin / Authorised Signature", 350, y + 8, { width: 185, align: "center" });
  doc.fontSize(8).text("This receipt was generated from an administrator-verified institute record.", 48, 760, { width: 499, align: "center" });
  doc.end();
  return completed;
}

function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
function formatDate(value: Date) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(value); }
