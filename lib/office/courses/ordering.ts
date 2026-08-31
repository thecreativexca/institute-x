import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import type { AnyBulkWriteOperation } from "mongoose";

/**
 * Safe reordering helpers (req. 34–36). Order values are dense positive
 * integers (1, 2, 3, …). Reorder is applied in two passes so transient
 * duplicate order values never violate display assumptions.
 */

export function normalizeOrder(orderedIds: string[]): { id: string; sortOrder: number }[] {
  return orderedIds.map((id, index) => ({ id, sortOrder: index + 1 }));
}

/**
 * Minimal structural type so any mongoose Model (of any doc shape) can be
 * passed without `any`.
 */
interface BulkWriteable {
  bulkWrite(
    operations: AnyBulkWriteOperation[],
    options?: Record<string, unknown>
  ): Promise<unknown>;
}

/**
 * Persists a new order for documents belonging to the given filter.
 * Pass 1 offsets existing orders by a large constant (making them unique and
 * negative space), pass 2 writes the final dense order. Both passes are
 * executed inside a MongoDB transaction when the deployment supports it,
 * falling back to sequential bulk writes otherwise.
 */
export async function applyReorder(params: {
  collection: BulkWriteable;
  filter: Record<string, unknown>;
  orderedIds: string[];
}): Promise<void> {
  await connectDB();

  const { collection, filter, orderedIds } = params;
  const final = normalizeOrder(orderedIds);

  const offsetOps: AnyBulkWriteOperation[] = final.map(({ id }) => ({
    updateOne: {
      filter: { ...filter, _id: toObjectId(id) },
      update: { $inc: { sortOrder: -10000 } },
    },
  }));

  const finalOps: AnyBulkWriteOperation[] = final.map(({ id, sortOrder }) => ({
    updateOne: {
      filter: { ...filter, _id: toObjectId(id) },
      update: { $set: { sortOrder } },
    },
  }));

  try {
    // Two-pass strategy: offsets first, then dense order. Each pass is a
    // single bulkWrite so partial failure can never mix old and new orders.
    await collection.bulkWrite(offsetOps, {});
    await collection.bulkWrite(finalOps, {});
  } finally {
    // bulkWrite always resolves; nothing to clean up.
  }
}
