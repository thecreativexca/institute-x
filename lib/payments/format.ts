export function formatCurrency(amountPaise: number, currency = "INR"): string {
  const amount = Number.isFinite(amountPaise) ? amountPaise / 100 : 0;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function rupeesToPaise(value: number): number {
  return Math.round(value * 100);
}
