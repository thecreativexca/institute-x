const LOCAL_ORIGIN = "http://local.invalid";
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/**
 * Accept only same-site absolute paths from query parameters. This keeps
 * post-auth redirects useful without allowing protocol-relative or external
 * open redirects.
 */
export function getSafeInternalPath(
  value: string | null | undefined,
  fallback: string
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    CONTROL_CHARACTERS.test(value)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(value, LOCAL_ORIGIN);
    if (parsed.origin !== LOCAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
