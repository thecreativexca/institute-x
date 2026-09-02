import { requireAdmin } from "@/lib/auth/helpers";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}