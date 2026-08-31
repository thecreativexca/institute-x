/**
 * Converts a byte count into a compact, human-readable size string.
 *
 * Examples:
 *   formatFileSize(0)          -> "0 B"
 *   formatFileSize(512)        -> "512 B"
 *   formatFileSize(2500000)    -> "2.38 MB"
 *
 * Client-safe: contains no server-only imports.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;

  // Bytes: no decimals. Everything else: up to 2 decimals, trailing zeros trimmed.
  const formatted =
    exponent === 0
      ? String(Math.round(value))
      : value
          .toFixed(2)
          .replace(/\.?0+$/, "");

  return `${formatted} ${units[exponent]}`;
}