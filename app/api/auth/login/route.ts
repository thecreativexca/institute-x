import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { loginSchema } from "@/lib/validations/user";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ACCOUNT_STATUSES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validation.data;

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash +emailVerificationToken +emailVerificationTokenExpiresAt"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== ACCOUNT_STATUSES.ACTIVE) {
      let message = "Your account is not active. Please contact support.";
      if (user.status === ACCOUNT_STATUSES.SUSPENDED) {
        message = "Your account has been suspended. Please contact support.";
      } else if (user.status === ACCOUNT_STATUSES.INACTIVE) {
        message = "Your account is inactive. Please contact support.";
      }
      return NextResponse.json(
        { success: false, error: message },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Please verify your email before continuing.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    await createSession(user, { persistent: rememberMe });

    return NextResponse.json(
      { success: true, message: "Login successful", redirect: "/student/dashboard" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
