/**
 * Phase 19 — Student analytics utilities (pure, no server actions).
 */

import { percentChange } from "./date-range";

/** Convenience used by pages to show a delta on new registrations. */
export function registrationsDelta(
  current: number,
  previous: number
): { delta: number; change: number | null } {
  return { delta: current - previous, change: percentChange(current, previous) };
}