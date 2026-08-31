import { NextRequest, NextResponse } from "next/server";

import { verifyCertificate } from "@/lib/certificates/verify";
import { isVerificationRateLimited } from "@/lib/certificates/http";
import { z } from "zod";

export const runtime = "nodejs";

const verifySchema = z.object({
  identifier: z.string().trim().min(1).max(64),
});

/**
 * POST /api/certificates/verify — public, read-only verification (spec §28–§31).
 *
 * Accepts a certificate number OR verification code, normalizes it, and looks
 * it up only against indexed fields. Returns minimal public data; never
 * modifies anything. A basic per-IP rate limit guards the endpoint.
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (isVerificationRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Please enter a certificate number or verification code." },
      { status: 400 }
    );
  }

  const result = await verifyCertificate(parsed.data.identifier);
  return NextResponse.json({ success: true, result }, { status: 200 });
}