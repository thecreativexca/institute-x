import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { emailSchema } from "@/lib/validations/common";
import {
  generatePasswordResetOtp,
  hashPasswordResetOtp,
  TOKEN_EXPIRY,
} from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { ACCOUNT_STATUSES, USER_ROLES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = emailSchema.safeParse(body.email);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address." },
        { status: 400 }
      );
    }

    const email = validation.data;

    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: USER_ROLES.STUDENT,
      status: ACCOUNT_STATUSES.ACTIVE,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    const otp = generatePasswordResetOtp();
    const tokenHash = hashPasswordResetOtp(email, otp);
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
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
