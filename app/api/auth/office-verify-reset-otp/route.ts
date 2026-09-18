import { NextRequest, NextResponse } from "next/server";

import { USER_ROLES } from "@/lib/constants";
import { verifyPasswordResetOtp } from "@/lib/auth/verify-password-reset-otp";

export async function POST(request: NextRequest) {
  try {
    const result = await verifyPasswordResetOtp(await request.json(), USER_ROLES.ADMIN);
    return NextResponse.json(result, { status: result.success ? 200 : result.status });
  } catch (error) {
    console.error("Verify office password reset OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify OTP right now. Please try again." },
      { status: 500 }
    );
  }
}
