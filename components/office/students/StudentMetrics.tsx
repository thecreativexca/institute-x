"use client";

import { UserCheck, UserPlus, Users, UserX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StudentMetricsProps {
  total: number;
  active: number;
  suspended: number;
  newThisMonth: number;
}

export function StudentMetrics({ total, active, suspended, newThisMonth }: StudentMetricsProps) {
  const metrics = [
    { title: "Total students", value: total, icon: Users, surface: "bg-primary-100", tone: "text-primary-800" },
    { title: "Active", value: active, icon: UserCheck, surface: "bg-emerald-50", tone: "text-emerald-700" },
    { title: "Suspended", value: suspended, icon: UserX, surface: "bg-rose-50", tone: "text-rose-700" },
    { title: "New this month", value: newThisMonth, icon: UserPlus, surface: "bg-accent-100", tone: "text-accent-800" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ title, value, icon: Icon, surface, tone }) => (
        <Card key={title} className="rounded-2xl border-slate-200/80 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
          <CardContent className="flex items-center justify-between p-5 sm:p-6">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value.toLocaleString()}</p>
            </div>
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${surface} ${tone}`}>
              <Icon className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
