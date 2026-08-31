import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { OFFICE_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";
import { verifyToken, hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { destroySession } from "@/lib/auth/session";

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

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (password.length > 72) {
      return NextResponse.json(
        { success: false, error: "Password must be at most 72 characters." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    await connectDB();

    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    // Check if user has an office role
    const isOfficeUser = user.role === "super_admin" ||
      user.role === "office_staff" ||
      user.role === "content_manager" ||
      user.role === "faculty";

    if (!isOfficeUser) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token." },
        { status: 400 }
      );
    }

    if (user.status !== ACCOUNT_STATUSES.ACTIVE) {
      return NextResponse.json(
        { success: false, error: "This account is not active." },
        { status: 403 }
      );
    }

    user.passwordHash = await hashPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    user.sessionVersion += 1; // Invalidate existing sessions
    await user.save();

    await destroySession();

    return NextResponse.json(
      { success: true, message: "Your password has been reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Office reset password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}