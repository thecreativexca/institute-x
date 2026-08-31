import { NextRequest, NextResponse } from "next/server";

import { destroySession } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session";
import { AuditEvents } from "@/lib/audit/log";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session) {
      await AuditEvents.officeLogout(session.id, session.role);
    }

    await destroySession();

    return NextResponse.json(
      { success: true, message: "Logged out successfully", redirect: "/office/login" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Office logout error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}