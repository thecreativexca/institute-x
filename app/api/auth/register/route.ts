import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { registerStudentSchema } from "@/lib/validations/user";
import { hashPassword } from "@/lib/auth/password";
import { generateSecureToken, hashToken, getTokenExpiry } from "@/lib/auth/tokens";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { siteConfig } from "@/lib/config/site";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerStudentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = validation.data;

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const tokenExpiresAt = new Date(Date.now() + getTokenExpiry("verification"));

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "student",
      status: "active",
      emailVerificationToken: tokenHash,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    });

    const verificationUrl = `${siteConfig.url}/verify-email?token=${rawToken}`;
    const expiryHours = getTokenExpiry("verification") / (1000 * 60 * 60);

    await sendVerificationEmail({
      studentId: user._id.toString(),
      studentName: name,
      studentEmail: email,
      verificationUrl,
      expiryHours,
    });

    return NextResponse.json(
      { success: true, message: "Registration successful. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}