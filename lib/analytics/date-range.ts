/**
 * Phase 19 — Report date ranges, timezone handling and bucket gap-filling.
 *
 * Every report uses ONE reporting timezone (Asia/Kolkata by default) so daily /
 * monthly metrics never mix UTC and browser-local boundaries (spec §10, §91).
 *
 * Ranges are URL-driven (`?range=30d` or `?from=YYYY-MM-DD&to=YYYY-MM-DD`) and
 * validated server-side (§8, §9, §112). Custom ranges are capped to prevent
 * abusive, unbounded aggregation.
 */

const DAY_MS = 86_400_000;

/** Institute reporting timezone. Overridable via env for deployments. */
export const REPORTING_TIME_ZONE =
  process.env.REPORTING_TIMEZONE ?? "Asia/Kolkata";

/** Hard cap for any custom date range (spec §9). */
export const MAX_CUSTOM_RANGE_DAYS = 366;

export type RangePreset =
  | "today"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

export type Granularity = "day" | "week" | "month";

export interface ReportRange {
  from: Date;
  to: Date;
  preset: RangePreset;
  granularity: Granularity;
  /** local YYYY-MM-DD keys for every bucket in [from,to] (gap-filling). */
  keys: string[];
}

export interface RangeParseResult {
  range: ReportRange | null;
  error?: string;
}

/* ------------------------- timezone day primitives ------------------------ */

interface ZonedParts {
  year: number;
  month: number;
  day: number;
}

const partsCache = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORTING_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function zonedParts(date: Date): ZonedParts {
  const p = partsCache.formatToParts(date);
  const get = (type: string) => Number(p.find((x) => x.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Local YYYY-MM-DD key for a Date in the reporting timezone. */
export function dayKey(date: Date): string {
  const { year, month, day } = zonedParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** UTC instant of local midnight for the given day (YYYY-MM-DD) in report tz. */
export function startOfDayUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** End of day (exclusive) — used as an exclusive upper bound in $match. */
export function endOfDayUtc(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1));
}

/** Start of today in the reporting timezone (as a Date). */
export function startOfTodayInTz(): Date {
  return startOfDayUtc(dayKey(new Date()));
}

/** Build the ordered day-key list covering [fromKey, toKey] inclusive. */
export function buildDayKeys(fromKey: string, toKey: string): string[] {
  const out: string[] = [];
  let cur = startOfDayUtc(fromKey).getTime();
  const endExclusive = endOfDayUtc(toKey).getTime();
  if (endExclusive <= cur) return out;
  while (cur < endExclusive) {
    out.push(dayKey(new Date(cur)));
    cur += DAY_MS;
  }
  return out;
}
/* ------------------------------- granularity ------------------------------ */

function chooseGranularity(days: number): Granularity {
  if (days <= 35) return "day";
  if (days <= 140) return "week";
  return "month";
}

function bucketFor(granularity: Granularity, key: string): string {
  if (granularity === "day") return key;
  const [y, m, d] = key.split("-").map(Number);
  if (granularity === "month") return `${y}-${String(m).padStart(2, "0")}`;
  // week: ISO-ish week anchored to Monday, keyed as YYYY-Www
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = (date.getUTCDay() + 6) % 7; // Monday=0
  const monday = new Date(Date.UTC(y, m - 1, d - day));
  const iso = isoWeek(monday);
  return `${iso.y}-W${String(iso.w).padStart(2, "0")}`;
}

function isoWeek(d: Date): { y: number; w: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week =
    1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
  return { y: firstThursday.getUTCFullYear(), w: week };
}

function bucketLabel(bucketKey: string, granularity: Granularity): string {
  if (granularity === "month") {
    const [y, m] = bucketKey.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(y, m - 1, 1)));
  }
  return bucketKey;
}

/** Map day buckets into week/month buckets, preserving order. */
export function rebucket(
  granularity: Granularity,
  dayKeys: string[]
): { key: string; label: string }[] {
  const seen = new Set<string>();
  const rows: { key: string; label: string }[] = [];
  for (const k of dayKeys) {
    const b = bucketFor(granularity, k);
    if (!seen.has(b)) {
      seen.add(b);
      rows.push({ key: b, label: bucketLabel(b, granularity) });
    }
  }
  return rows;
}

/* ------------------------------- range logic ------------------------------ */

function dateInput(value: unknown): { fromKey: string; toKey: string } | null {
  if (typeof value !== "string" || !value) return null;
  const parts = value.trim().split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  const fromKey = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { fromKey, toKey: fromKey };
}
/**
 * Parse and validate a report range from URL search params.
 * Returns a canonical ReportRange plus a bucket key list.
 */
export function parseReportRange(params: {
  range?: unknown;
  preset?: unknown;
  from?: unknown;
  to?: unknown;
}): RangeParseResult {
  try {
    const preset = (params.range ?? params.preset ?? "30d") as string;
    const todayStart = startOfTodayInTz().getTime();

    if (preset === "custom") {
      const fromInput = dateInput(params.from);
      const toInput = dateInput(params.to ?? params.from);
      if (!fromInput || !toInput) {
        return { range: null, error: "Invalid custom date range" };
      }
      const spans = buildDayKeys(fromInput.fromKey, fromInput.toKey);
      if (spans.length === 0) {
        return { range: null, error: "From date is after To date" };
      }
      if (spans.length > MAX_CUSTOM_RANGE_DAYS) {
        return {
          range: null,
          error: `Maximum report range is ${MAX_CUSTOM_RANGE_DAYS} days`,
        };
      }
      return buildRange(fromInput.fromKey, fromInput.toKey, "custom");
    }

    let fromKey: string | null = null;
    let toKey = dayKey(new Date());

    switch (preset) {
      case "today":
        fromKey = dayKey(new Date(todayStart));
        break;
      case "7d":
        fromKey = dayKey(new Date(todayStart - 6 * DAY_MS));
        break;
      case "30d":
        fromKey = dayKey(new Date(todayStart - 29 * DAY_MS));
        break;
      case "this_month": {
        const t = new Date(todayStart);
        const y = t.getUTCFullYear();
        const m = t.getUTCMonth();
        fromKey = dayKey(new Date(Date.UTC(y, m, 1)));
        toKey = dayKey(new Date(Date.UTC(y, m + 1, 0)));
        break;
      }
      case "last_month": {
        const t = new Date(todayStart);
        const y = t.getUTCFullYear();
        const m = t.getUTCMonth();
        fromKey = dayKey(new Date(Date.UTC(y, m - 1, 1)));
        toKey = dayKey(new Date(Date.UTC(y, m, 0)));
        break;
      }
      case "this_year": {
        const t = new Date(todayStart);
        const y = t.getUTCFullYear();
        fromKey = dayKey(new Date(Date.UTC(y, 0, 1)));
        toKey = dayKey(new Date(Date.UTC(y, 11, 31)));
        break;
      }
      default:
        return { range: null, error: "Unknown range preset" };
    }

    return buildRange(fromKey!, toKey, preset as RangePreset);
  } catch {
    return { range: null, error: "Invalid date range" };
  }
}

function buildRange(
  fromKey: string,
  toKey: string,
  preset: RangePreset
): RangeParseResult {
  const dayKeysList = buildDayKeys(fromKey, toKey);
  if (dayKeysList.length === 0) {
    return { range: null, error: "From date is after To date" };
  }
  const granularity = chooseGranularity(dayKeysList.length);
  return {
    range: {
      from: startOfDayUtc(fromKey),
      to: endOfDayUtc(toKey),
      preset,
      granularity,
      keys: dayKeysList,
    },
  };
}

/**
 * Comparison period: the equal-length period immediately preceding the
 * selected range (spec §11). Used for KPI deltas.
 */
export function previousPeriod(range: ReportRange): {
  from: Date;
  to: Date;
  keys: string[];
} {
  const durationMs = range.to.getTime() - range.from.getTime();
  const prevEnd = new Date(range.from.getTime());
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  const keys = buildDayKeys(dayKey(prevStart), dayKey(new Date(prevEnd.getTime() - 1)));
  return { from: prevStart, to: prevEnd, keys };
}

/* ------------------------------- gap filling ------------------------------ */

/** Fill a sparse map of key->value with zero values for the range buckets. */
export function fillSeries<T>(
  data: Record<string, T>,
  range: ReportRange,
  zero: () => T
): { key: string; label: string; value: T }[] {
  const buckets = rebucket(range.granularity, range.keys);
  return buckets.map(({ key, label }) => ({
    key,
    label,
    value: data[key] ?? zero(),
  }));
}

/** Safe % change; returns null when previous total is 0 (avoid Infinity). */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) {
    return current === 0 ? 0 : null; // "New" — no baseline
  }
  return ((current - previous) / previous) * 100;
}

export { DAY_MS };