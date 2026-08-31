import { StudentAuthShell } from "@/components/auth/student-auth-shell";

/** Centered authentication shell for student account flows. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <StudentAuthShell>{children}</StudentAuthShell>;
}
