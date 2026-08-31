import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";

/**
 * Atomic per-(type, year) counter backing human-readable certificate numbers.
 *
 * Certificate numbers must be stable and unique, but a naive
 * `countDocuments() + 1` is unsafe under concurrent issuance. Each issuance
 * atomically increments `value` via `findOneAndUpdate(..., { $inc }, { new })`
 * inside a unique `(type, year)` document, so concurrent requests can never
 * generate the same official number.
 */
export interface ICertificateSequence {
  _id: Types.ObjectId;
  type: string;
  year: number;
  value: number;
}

const CertificateSequenceSchema = new Schema<ICertificateSequence>(
  {
    type: { type: String, required: true },
    year: { type: Number, required: true },
    value: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// One counter row per certificate type per year.
CertificateSequenceSchema.index({ type: 1, year: 1 }, { unique: true });

export const CertificateSequence = defineModel(
  "CertificateSequence",
  CertificateSequenceSchema
);