import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { verifyToken, hashToken } from "@/lib/auth/tokens";
import { sendWelcomeEmail } from "@/lib/email";
import { siteConfig } from "@/lib/config/site";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    await connectDB();

    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { success: true, message: "Email already verified. You can now log in." },
        { status: 200 }
      );
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiresAt = undefined;
    await user.save();

    // Send welcome email after successful verification
    await sendWelcomeEmail({
      studentId: user._id.toString(),
      studentName: user.name,
      studentEmail: user.email,
    });

    return NextResponse.json(
      { success: true, message: "Email verified successfully. You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}