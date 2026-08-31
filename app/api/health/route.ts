import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db/connect";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — infrastructure health check.
 * Reports whether the app can reach MongoDB. Useful for monitoring and for
 * verifying the connection utility without exposing any sensitive data.
 */
export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      status: "ok",
      database: "connected",
      readyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
