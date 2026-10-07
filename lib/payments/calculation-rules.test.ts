import assert from "node:assert/strict";
import test from "node:test";

import { FEE_STATUSES } from "../constants";
import { calculateRecordableAmount, deriveFeeStatus } from "./calculation-rules";

test("unpaid enrollment has the full amount remaining", () => {
  const result = deriveFeeStatus({ totalFee: 100_000, verifiedPayments: 0, refundedAmount: 0, pendingAmount: 0 });
  assert.equal(result.status, FEE_STATUSES.UNPAID);
  assert.equal(result.remainingAmount, 100_000);
});

test("pending payment does not count as collected", () => {
  const result = deriveFeeStatus({ totalFee: 100_000, verifiedPayments: 0, refundedAmount: 0, pendingAmount: 25_000 });
  assert.equal(result.status, FEE_STATUSES.PENDING_VERIFICATION);
  assert.equal(result.totalPaid, 0);
  assert.equal(calculateRecordableAmount(result), 75_000);
});

test("multiple verified installments accumulate", () => {
  const partial = deriveFeeStatus({ totalFee: 100_000, verifiedPayments: 40_000, refundedAmount: 0, pendingAmount: 0 });
  const paid = deriveFeeStatus({ totalFee: 100_000, verifiedPayments: 100_000, refundedAmount: 0, pendingAmount: 0 });
  assert.equal(partial.status, FEE_STATUSES.PARTIALLY_PAID);
  assert.equal(partial.remainingAmount, 60_000);
  assert.equal(paid.status, FEE_STATUSES.PAID);
  assert.equal(paid.remainingAmount, 0);
});

test("partial refund reopens the remaining balance", () => {
  const result = deriveFeeStatus({ totalFee: 100_000, verifiedPayments: 100_000, refundedAmount: 25_000, pendingAmount: 0 });
  assert.equal(result.status, FEE_STATUSES.PARTIALLY_PAID);
  assert.equal(result.totalPaid, 75_000);
  assert.equal(result.remainingAmount, 25_000);
});

test("full refund keeps an auditable refunded state", () => {
  const result = deriveFeeStatus({ totalFee: 100_000, verifiedPayments: 100_000, refundedAmount: 100_000, pendingAmount: 0 });
  assert.equal(result.status, FEE_STATUSES.REFUNDED);
  assert.equal(result.totalPaid, 0);
});
