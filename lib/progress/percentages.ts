/**
 * Percentage utilities (spec §40).
 *
 * Every percentage that leaves the progress services goes through these
 * functions so that:
 *   - values are always clamped to [0, 100]
 *   - zero denominators never produce NaN or Infinity
 *   - rounding is consistent across the application
 *   - no percentage is ever negative
 *
 * This module is dependency-free (no imports) so it can be unit-tested with a
 * plain Node script (see scripts/progress-tests.mjs).
 */

/** Rounds to a whole number, clamping weird inputs to 0. */
export function roundPercentage(value: number, decimals = 0): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** Math.max(0, Math.min(8, decimals));
  return Math.round(value * factor) / factor;
}

/** Clamps any finite number to the inclusive range [0, 100]. */
export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * `numerator / denominator * 100`, safely.
 *
 * Returns `null` when the denominator is not a positive finite number OR when
 * either input is not finite — callers translate `null` into "not meaningful"
 * states (e.g. "no published lessons yet") instead of showing a bogus 0%.
 */
export function safePercentage(
  numerator: number,
  denominator: number
): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return null;
  }
  if (denominator <= 0) {
    return null;
  }
  return clampPercentage((numerator / denominator) * 100);
}

/** Like safePercentage but always returns a number (0 for empty denominators). */
export function safePercentageOrZero(
  numerator: number,
  denominator: number
): number {
  const value = safePercentage(numerator, denominator);
  return value === null ? 0 : roundPercentage(value);
}

/**
 * Normalized performance across items that may have different maximum marks:
 * `Σ awarded / Σ possible × 100`.
 *
 * Returns `null` when there is nothing to normalize over (zero possible marks),
 * so the UI can say "no graded submissions yet" instead of "0%".
 */
export function normalizedPercentage(
  awarded: number,
  possible: number
): number | null {
  if (!Number.isFinite(awarded) || !Number.isFinite(possible)) {
    return null;
  }
  if (possible <= 0) {
    return null;
  }
  return clampPercentage((awarded / possible) * 100);
}