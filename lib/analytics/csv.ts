/**
 * Phase 19 — Safely CSV-encode report tables for export (Part M, spec §97–§101).
 *
 * Formula-injection protection (spec §100, §143): any cell value beginning with
 * `=`, `+`, `-`, `@`, or tab/CR is escaped with a leading single quote so a
 * spreadsheet never executes it as a formula.
 */

const UNSAFE_START = /^[=+\-@\t\r]/;

/** Escape a single cell: neutralize formula injection and quote CSV specials. */
export function escapeCell(value: unknown): string {
  let str = value === null || value === undefined ? "" : String(value);
  str = str.replace(/\r?\n/g, " ");
  if (UNSAFE_START.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a CSV string from headers + row arrays (already sanitized cells). */
export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines: string[] = [];
  lines.push(headers.map((h) => escapeCell(h)).join(","));
  for (const row of rows) {
    lines.push(row.map((cell) => escapeCell(cell)).join(","));
  }
  return lines.join("\r\n");
}

/** Wrap a CSV string as a downloadable Response. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}