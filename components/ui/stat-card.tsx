import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  surfaceClassName?: string;
  toneClassName?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  surfaceClassName = "bg-primary-100",
  toneClassName = "text-primary-800",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-slate-200/80 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              surfaceClassName,
              toneClassName,
            )}
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
