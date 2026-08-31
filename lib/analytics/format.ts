/**
 * Phase 19 — Reporting number/date formatting helpers.
 *
 * These are the ONLY formatting utilities the reports UI should use, so all
 * report sections produce consistently locale-friendly, deception-free output.
 * Migration note: the existing `formatCurrency` in lib/payments/razorpay.ts
 * expects a RUPEES amount (it does not divide by 100). Payment `amount` in the
 * DB is stored in PAISE (Phase 13), so reports always display via
 * `formatCurrencyFromPaise` which performs the unit conversion explicitly to
 * avoid mixing rupees and paise (spec §30).
 */

/** Locale-friendly integer/number formatting (en-IN grouping for the institute). */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits,
  }).format(value);
}

/**
 * Safe percentage formatting. Returns the raw count+suffix context instead of
 * a misleading number when the denominator is missing (spec §12, §41).
 */
export function formatPercentage(
  value: number | null | undefined,
  digits = 0
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(value)}%`;
}

/** Format an integer amount stored in PAISE as a locale currency string. */
export function formatCurrencyFromPaise(
  amountPaise: number,
  currency = "INR"
): string {
  if (!Number.isFinite(amountPaise)) amountPaise = 0;
  const rupees = amountPaise / 100;
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** Format rupees (not paise) as currency — for price snapshots already in rupees. */
export function formatCurrencyRupees(value: number, currency = "INR"): string {
  if (!Number.isFinite(value)) value = 0;
  return formatCurrencyFromPaise(Math.round(value * 100), currency);
}

/**
 * Human-friendly duration from milliseconds (spec §65 resolution time).
 * Returns sensible units: "3h", "2d 4h", "45m", "1w".
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  if (ms < MINUTE) return `${Math.max(0, Math.round(ms / 1000))}s`;
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}m`;
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR);
    const m = Math.round((ms % HOUR) / MINUTE);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(ms / DAY);
  const h = Math.round((ms % DAY) / HOUR);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

/** ISO date label (YYYY-MM-DD) used in tables/charts, in the given timezone. */
export function formatDateKey(key: string): string {
  if (!key) return "—";
  try {
    const [y, m, d] = key.split("-").map(Number);
    if (!y || !m || !d) return key;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    return key;
  }
}

/** Format a Date as a local (site default) readable datetime string. */
export function formatTimestamp(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}