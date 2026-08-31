import crypto from "crypto";
import Razorpay from "razorpay";

import { env } from "@/lib/config/env";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/lib/constants";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return razorpayInstance;
}

export function convertToPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}

export function convertFromPaise(amountInPaise: number): number {
  return amountInPaise / 100;
}

export function formatCurrency(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${year}-${randomPart}`;
}

export interface CreateRazorpayOrderParams {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(params: CreateRazorpayOrderParams) {
  const razorpay = getRazorpayInstance();
  const order = await razorpay.orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  });
  return order;
}

export interface VerifyPaymentSignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export function verifyPaymentSignature(params: VerifyPaymentSignatureParams): boolean {
  const { orderId, paymentId, signature } = params;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

export function getProviderFromCourse(course: { isFree?: boolean }): PaymentProvider {
  return course.isFree ? PAYMENT_PROVIDERS.FREE : PAYMENT_PROVIDERS.RAZORPAY;
}

export function calculateCourseAmount(course: { price?: number; isFree?: boolean }): number {
  if (course.isFree || (course.price ?? 0) === 0) {
    return 0;
  }
  return convertToPaise(course.price ?? 0);
}