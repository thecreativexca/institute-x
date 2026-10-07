import "server-only";

import { PaymentSequence } from "@/models/PaymentSequence";

export async function generateReceiptNumber(date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const sequence = await PaymentSequence.findOneAndUpdate(
    { _id: `receipt-${year}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return `REC-${year}-${String(sequence.value).padStart(6, "0")}`;
}
