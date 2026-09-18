import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { ACCOUNT_STATUSES } from "@/lib/constants";
import {
  generatePasswordResetOtp,
  hashPasswordResetOtp,
  TOKEN_EXPIRY,
} from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Generic response to prevent account enumeration
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Check if user has an admin (office) role
    const isOfficeUser = user.role === "admin";

    if (!isOfficeUser) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    if (user.status !== ACCOUNT_STATUSES.ACTIVE) {
      return NextResponse.json(
        { success: false, error: "This account is not active." },
        { status: 403 }
      );
    }

    const otp = generatePasswordResetOtp();
    const tokenHash = hashPasswordResetOtp(email.toLowerCase(), otp);
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET_OTP);

    user.passwordResetToken = tokenHash;
    user.passwordResetTokenExpiresAt = tokenExpiresAt;
    user.passwordResetOtpAttempts = 0;
    await user.save();

    const expiryMinutes = TOKEN_EXPIRY.PASSWORD_RESET_OTP / (1000 * 60);

    const emailResult = await sendPasswordResetEmail({
      studentId: user._id.toString(),
      studentName: user.name,
      studentEmail: email,
      otp,
      expiryMinutes,
      requestId: tokenHash,
    });

    if (!emailResult.success) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpiresAt = undefined;
      user.passwordResetOtpAttempts = 0;
      await user.save();

      return NextResponse.json(
        { success: false, error: "We could not send the reset email right now. Please try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Office forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
