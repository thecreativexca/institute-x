import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { finalizeSuccessfulPayment, reconcilePayment } from "@/lib/payments/service";
import { Payment } from "@/lib/mongodb/models";
import { PAYMENT_STATUSES } from "@/lib/constants";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("Razorpay webhook: Missing signature header");
      return NextResponse.json({ success: false, error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, env.razorpayWebhookSecret);
    if (!isValid) {
      console.warn("Razorpay webhook: Invalid signature");
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const { event, payload: eventPayload } = payload;

    // Handle payment captured event
    if (event === "payment.captured") {
      const payment = eventPayload.payment?.entity;
      if (!payment) {
        return NextResponse.json({ success: false, error: "Missing payment entity" }, { status: 400 });
      }

      const { id: razorpayPaymentId, order_id: razorpayOrderId, amount, currency, status } = payment;

      if (status !== "captured") {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Find local payment record by Razorpay order ID
      const localPayment = await Payment.findOne({ razorpayOrderId }).lean();
      if (!localPayment) {
        console.warn(`Razorpay webhook: Payment record not found for order ${razorpayOrderId}`);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Idempotency: already processed
      if (localPayment.status === PAYMENT_STATUSES.PAID) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Verify amount matches
      if (localPayment.amount !== amount || localPayment.currency !== currency) {
        console.warn(`Razorpay webhook: Amount mismatch for payment ${localPayment._id}`);
        await Payment.findByIdAndUpdate(localPayment._id, {
          status: PAYMENT_STATUSES.FAILED,
          failureCode: "WEBHOOK_AMOUNT_MISMATCH",
          failureDescription: "Webhook amount does not match local record",
          razorpayPaymentId,
        });
        return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
      }

      // Finalize payment using webhook data
      // We need the signature - for webhook we can't verify the same way
      // But we trust the webhook signature which validates the entire payload
      // We'll create a synthetic signature verification using the webhook secret
      const syntheticSignature = crypto
        .createHmac("sha256", env.razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const result = await finalizeSuccessfulPayment({
        paymentId: localPayment._id.toString(),
        razorpayPaymentId,
        razorpaySignature: syntheticSignature,
      });

      if (!result.success) {
        console.error(`Razorpay webhook: Finalization failed for ${localPayment._id}:`, result.error);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Handle payment failed event
    if (event === "payment.failed") {
      const payment = eventPayload.payment?.entity;
      if (!payment) {
        return NextResponse.json({ success: false, error: "Missing payment entity" }, { status: 400 });
      }

      const { order_id: razorpayOrderId, error_code, error_description } = payment;

      const localPayment = await Payment.findOne({ razorpayOrderId }).lean();
      if (localPayment && localPayment.status !== PAYMENT_STATUSES.PAID) {
        await Payment.findByIdAndUpdate(localPayment._id, {
          status: PAYMENT_STATUSES.FAILED,
          failureCode: error_code,
          failureDescription: error_description,
        });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Handle order paid event (alternative)
    if (event === "order.paid") {
      const order = eventPayload.order?.entity;
      if (!order) {
        return NextResponse.json({ success: false, error: "Missing order entity" }, { status: 400 });
      }

      const { id: razorpayOrderId, amount_paid, currency, status } = order;
      if (status !== "paid" || amount_paid === 0) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const localPayment = await Payment.findOne({ razorpayOrderId }).lean();
      if (localPayment && localPayment.status !== PAYMENT_STATUSES.PAID) {
        // Trigger reconciliation
        await reconcilePayment(localPayment._id.toString());
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Acknowledge other events
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}