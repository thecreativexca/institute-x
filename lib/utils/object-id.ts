import { Types } from "mongoose";

/**
 * Validates a 24-char hex Mongo id and returns it as Types.ObjectId.
 * Invalid ids throw immediately (callers translate to 404/400).
 */
export function toObjectId(id: string): Types.ObjectId {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new TypeError("Invalid identifier");
  }
  return new Types.ObjectId(id);
}

/** Non-throwing variant for boolean checks. */
export function isValidObjectId(id: string | undefined | null): boolean {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}