import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface StudentPageHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
  eyebrow?: string;
  action?: ReactNode;
}

export function StudentPageHeader({
  title,
  description,
  icon,
  eyebrow = "Student workspace",
  action,
}: StudentPageHeaderProps) {
  return (
    <section className="student-page-header">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-200 text-primary-900 shadow-sm">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700">
              <Sparkles className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" /> {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        {action ? <div className="shrink-0 sm:self-center">{action}</div> : null}
      </div>
    </section>
  );
}
