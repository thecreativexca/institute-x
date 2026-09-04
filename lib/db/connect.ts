import mongoose from "mongoose";

import { env } from "@/lib/config/env";



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

/** Transient errors (e.g. DNS blips on IPv6/NAT64 networks) worth retrying. */
function isTransient(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "MongoServerSelectionError" ||
      /ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN/i.test(error.message))
  );
}

/**
 * Connects once with a couple of quick retries so a transient DNS failure
 * does not take down an entire server render. Cached afterwards.
 */
async function connectWithRetry(attempts = 3): Promise<mongoose.Mongoose> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await mongoose.connect(env.mongoDbUri, {
        // Do not queue operations before the connection resolves.
        bufferCommands: false,
        // Cap the pool; suitable default for serverless/Node hosting.
        maxPoolSize: 10,
        // Fail fast enough to retry within the same request.
        serverSelectionTimeoutMS: 8_000,
      });
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransient(error)) break;
      console.warn(
        `MongoDB connect attempt ${attempt}/${attempts} failed (${error instanceof Error ? error.message : error}); retrying…`
      );
      await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
    }
  }
  throw lastError;
}

export async function connectDB(): Promise<mongoose.Mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = connectWithRetry().catch((error: unknown) => {
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
