import { headers } from "next/headers";

import { requireAdmin } from "@/lib/auth/helpers";

/** Auth routes nested under /office that must be reachable while logged out. */
const OFFICE_AUTH_PATHS = new Set([
  "/office/login",
  "/office/forgot-password",
  "/office/reset-password",
]);

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  // The proxy forwards the requested pathname as x-pathname so this guard can
  // skip the office auth pages; every other /office/* route needs an admin.
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (!OFFICE_AUTH_PATHS.has(pathname)) {
    await requireAdmin();
  }

  return children;
}