import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();
  } catch (error) {
    console.error("Logout error:", error);
  }

  // This endpoint is submitted by regular HTML forms in the public header
  // and student portal. A 303 changes the POST into a clean GET and keeps
  // the destination independent from a localhost/deployment request origin.
  return NextResponse.redirect("https://www.thecx.in/", 303);
}
