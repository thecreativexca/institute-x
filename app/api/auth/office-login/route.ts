import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { OFFICE_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { AuditEvents } from "@/lib/audit/log";
import { loginSchema } from "@/lib/validations/user";

export async function POST(request: NextRequest) {
  try {
    const validation = loginSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid email address and password.",
          issues: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = validation.data;

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash +sessionVersion"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check if user has an office role
    const isOfficeUser = OFFICE_ROLES.includes(
      user.role as (typeof OFFICE_ROLES)[number]
    );

    if (!isOfficeUser) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== ACCOUNT_STATUSES.ACTIVE) {
      let message = "Your account is not active. Please contact the administrator.";
      if (user.status === ACCOUNT_STATUSES.SUSPENDED) {
        message = "Your account has been suspended. Please contact the administrator.";
      } else if (user.status === ACCOUNT_STATUSES.INACTIVE) {
        message = "Your account is inactive. Please contact the administrator.";
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
      // Log failed login attempt
      await AuditEvents.officeLogin(user._id.toString(), user.role, { ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined, userAgent: request.headers.get("user-agent") || undefined });
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Update login timestamps
    user.lastLoginAt = new Date();
    user.lastOfficeLoginAt = new Date();
    await user.save();

    // Create session
    await createSession(user, { persistent: rememberMe });

    // Log successful login
    await AuditEvents.officeLogin(user._id.toString(), user.role, {
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      { success: true, message: "Login successful", redirect: "/office" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Office login error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
