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
  } catch (error) {
    console.error("Office logout error:", error);
  }

  try {
    await destroySession();
  } catch (error) {
    console.error("Office session destroy error:", error);
  }

  // 303 See Other turns the form POST into a GET to the login page,
  // avoiding a JSON body (and a POST re-submit) in the browser.
  return NextResponse.redirect(new URL("/office/login", request.url), 303);
}