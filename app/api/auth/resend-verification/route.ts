import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { emailSchema } from "@/lib/validations/common";
import { generateSecureToken, hashToken, getTokenExpiry } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { siteConfig } from "@/lib/config/site";

const RESEND_COOLDOWN_MS = 60 * 1000;

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

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, a verification link has been sent.",
        },
        { status: 200 }
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { success: false, error: "Email is already verified. Please log in." },
        { status: 400 }
      );
    }

    if (user.emailVerificationTokenExpiresAt) {
      const timeSinceLastSent = Date.now() - (user.emailVerificationTokenExpiresAt.getTime() - getTokenExpiry("verification"));
      if (timeSinceLastSent < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSent) / 1000);
        return NextResponse.json(
          { success: false, error: `Please wait ${remainingSeconds} seconds before requesting another email.` },
          { status: 429 }
        );
      }
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const tokenExpiresAt = new Date(Date.now() + getTokenExpiry("verification"));

    user.emailVerificationToken = tokenHash;
    user.emailVerificationTokenExpiresAt = tokenExpiresAt;
    await user.save();

    const verificationUrl = `${siteConfig.url}/verify-email?token=${rawToken}`;
    const expiryHours = getTokenExpiry("verification") / (1000 * 60 * 60);

    await sendVerificationEmail({
      studentId: user._id.toString(),
      studentName: user.name,
      studentEmail: email,
      verificationUrl,
      expiryHours,
    });

    return NextResponse.json(
      { success: true, message: "If an account exists with this email, a verification link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}