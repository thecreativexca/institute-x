import mongoose, { Schema, type Model } from "mongoose";

/**
 * Registers a Mongoose model exactly once per process.
 *
 * During development Next.js reloads modules on every change; without this
 * guard `mongoose.model()` would throw "Cannot overwrite model" errors.
 *
 * Mongoose 9 typings: document interfaces are plain (they do NOT extend
 * mongoose.Document), so TSchema is unconstrained here.
 */
export function defineModel<TSchema>(
  name: string,
  schema: Schema<TSchema>
): Model<TSchema> {
  const existing = mongoose.models[name] as Model<TSchema> | undefined;
  return existing ?? mongoose.model<TSchema>(name, schema);
}
