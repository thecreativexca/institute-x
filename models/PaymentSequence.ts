import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";

interface IPaymentSequence {
  _id: string;
  value: number;
}

const PaymentSequenceSchema = new Schema<IPaymentSequence>({
  _id: { type: String, required: true },
  value: { type: Number, required: true, default: 0 },
});

export const PaymentSequence = defineModel("PaymentSequence", PaymentSequenceSchema);
