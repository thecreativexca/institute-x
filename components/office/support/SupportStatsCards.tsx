"use client";

import { AlertCircle, AlertTriangle, Clock, MessageSquare, User, Zap } from "lucide-react";

interface SupportStatsCardsProps {
  stats: {
    open: number;
    inProgress: number;
    waiting: number;
    unassigned: number;
    high: number;
    urgent: number;
  };
}

const statCards = [
  {
    label: "Open",
    value: "open" as const,
    icon: MessageSquare,
    bg: "bg-blue-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    numColor: "text-blue-700",
    border: "border-l-blue-500",
    dot: "bg-blue-500",
  },
  {
    label: "In Progress",
    value: "inProgress" as const,
    icon: Clock,
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    numColor: "text-violet-700",
    border: "border-l-violet-500",
    dot: "bg-violet-500",
  },
  {
    label: "Waiting",
    value: "waiting" as const,
    icon: AlertCircle,
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    numColor: "text-amber-700",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  {
    label: "Unassigned",
    value: "unassigned" as const,
    icon: User,
    bg: "bg-slate-50",
    iconBg: "bg-slate-200",
    iconColor: "text-slate-600",
    numColor: "text-slate-700",
    border: "border-l-slate-400",
    dot: "bg-slate-400",
  },
  {
    label: "High Priority",
    value: "high" as const,
    icon: AlertTriangle,
    bg: "bg-orange-50",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    numColor: "text-orange-700",
    border: "border-l-orange-500",
    dot: "bg-orange-500",
  },
  {
    label: "Urgent",
    value: "urgent" as const,
    icon: Zap,
    bg: "bg-rose-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    numColor: "text-rose-700",
    border: "border-l-rose-500",
    dot: "bg-rose-500",
  },
] as const;

export function SupportStatsCards({ stats }: SupportStatsCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map(({ label, value, icon: Icon, bg, iconBg, iconColor, numColor, border, dot }) => (
        <div
          key={value}
          className={`relative overflow-hidden rounded-2xl border border-slate-200/70 ${bg} border-l-4 ${border} p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
              <p className={`mt-2 text-3xl font-bold tabular-nums leading-none ${numColor}`}>
                {stats[value]}
              </p>
            </div>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />
            </span>
          </div>
          {stats[value] > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
              <span className="text-xs text-slate-500">Active</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
