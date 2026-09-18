import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { passwordSchema } from "@/lib/validations/common";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { destroySession } from "@/lib/auth/session";
import { ACCOUNT_STATUSES, USER_ROLES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Reset token is required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const passwordHash = await hashPassword(password);

    await connectDB();

    const user = await User.findOneAndUpdate(
      {
        passwordResetToken: tokenHash,
        passwordResetTokenExpiresAt: { $gt: new Date() },
        role: USER_ROLES.STUDENT,
        status: ACCOUNT_STATUSES.ACTIVE,
      },
      {
        $set: { passwordHash },
        $unset: {
          passwordResetToken: "",
          passwordResetTokenExpiresAt: "",
          passwordResetOtpAttempts: "",
        },
        $inc: { sessionVersion: 1 },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    await destroySession();

    return NextResponse.json(
      { success: true, message: "Your password has been reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
