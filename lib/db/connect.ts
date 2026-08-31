import mongoose from "mongoose";

import { env } from "@/lib/config/env";

/**
 * Reusable MongoDB connection utility.
 *
 * - Uses the global object to cache the connection across Next.js hot reloads
 *   in development so we never create a new connection per module reload.
 * - In production the module scope persists, so the cache simply works there.
 * - Reads credentials ONLY from environment variables (see .env.local.example).
 * - Fails fast with a clear error when MONGODB_URI is missing.
 */

interface MongooseCache {
  /** Established connection, if any. */
  conn: mongoose.Mongoose | null;
  /** In-flight connection promise, if any. */
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  // This must be `var` so it survives module reloads on globalThis.
  var __instituteMongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache =
  global.__instituteMongooseCache ??
  (global.__instituteMongooseCache = { conn: null, promise: null });

export async function connectDB(): Promise<mongoose.Mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    const uri = env.mongoDbUri;

    cache.promise = mongoose
      .connect(uri, {
        // Do not queue operations before the connection resolves.
        bufferCommands: false,
        // Cap the pool; suitable default for serverless/Node hosting.
        maxPoolSize: 10,
      })
      .catch((error: unknown) => {
        // Reset the cached promise so a later request can retry cleanly
        // instead of awaiting a permanently failed promise forever.
        cache.promise = null;
        throw new Error(
          `MongoDB connection failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/** Closes the connection (useful for tests/scripts). */
export async function disconnectDB(): Promise<void> {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}
