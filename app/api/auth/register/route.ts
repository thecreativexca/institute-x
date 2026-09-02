import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { registerStudentSchema } from "@/lib/validations/user";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ACCOUNT_STATUSES } from "@/lib/constants";

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

    // Email verification is removed: the account is verified at signup so a
    // student can start immediately, without a verification link or email.
    const now = new Date();
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "student",
      status: ACCOUNT_STATUSES.ACTIVE,
      emailVerifiedAt: now,
      lastLoginAt: now,
    });

    // Log the student straight in — no separate "verify your email" step.
    await createSession(user);

    return NextResponse.json(
      { success: true, message: "Registration successful", redirect: "/student/dashboard" },
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
