import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { ACCOUNT_STATUSES } from "@/lib/constants";
import { generateSecureToken, hashToken, getTokenExpiry } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { siteConfig } from "@/lib/config/site";

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

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const tokenExpiresAt = new Date(Date.now() + getTokenExpiry("password_reset"));

    user.passwordResetToken = tokenHash;
    user.passwordResetTokenExpiresAt = tokenExpiresAt;
    await user.save();

    const resetUrl = `${siteConfig.url}/office/reset-password?token=${rawToken}`;
    const expiryMinutes = getTokenExpiry("password_reset") / (1000 * 60);

    await sendPasswordResetEmail({
      studentId: user._id.toString(),
      studentName: user.name,
      studentEmail: email,
      resetUrl,
      expiryMinutes,
    });

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