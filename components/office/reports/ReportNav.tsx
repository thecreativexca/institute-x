import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ReportAbilities } from "@/lib/analytics/permissions";

type TabKey =
  | "overview"
  | "students"
  | "enrollments"
  | "courses"
  | "revenue"
  | "learning"
  | "assignments"
  | "quizzes"
  | "certificates"
  | "support"
  | "activity";

interface ReportNavProps {
  current: TabKey;
  abilities: ReportAbilities;
}

/** Permission-aware sub-navigation for the reports section (spec §5, §6). */
export function ReportNav({ current, abilities }: ReportNavProps) {
  const tabs: { key: TabKey; label: string; href: string; visible: boolean }[] = [
    { key: "overview", label: "Overview", href: "/office/reports", visible: abilities.read },
    { key: "students", label: "Students", href: "/office/reports/students", visible: abilities.students },
    { key: "enrollments", label: "Enrollments", href: "/office/reports/enrollments", visible: abilities.enrollments },
    { key: "courses", label: "Courses", href: "/office/reports/courses", visible: abilities.courses },
    { key: "revenue", label: "Revenue", href: "/office/reports/revenue", visible: abilities.revenue },
    { key: "learning", label: "Learning", href: "/office/reports/learning", visible: abilities.read },
    { key: "assignments", label: "Assignments", href: "/office/reports/assignments", visible: abilities.assignments },
    { key: "quizzes", label: "Quizzes", href: "/office/reports/quizzes", visible: abilities.quizResults },
    { key: "certificates", label: "Certificates", href: "/office/reports/certificates", visible: abilities.certificates },
    { key: "support", label: "Support", href: "/office/reports/support", visible: abilities.support },
    { key: "activity", label: "Audit", href: "/office/reports/activity", visible: abilities.audit },
  ];

  return (
    <nav aria-label="Report sections" className="flex flex-wrap gap-1.5">
      {tabs
        .filter((t) => t.visible)
        .map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={current === t.key ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              current === t.key
                ? "bg-primary-50 text-primary-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {t.label}
          </Link>
        ))}
    </nav>
  );
}