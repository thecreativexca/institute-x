"use client";

import { AlertCircle, AlertTriangle, Clock, MessageSquare, User, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

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
  { label: "Open", value: "open", icon: MessageSquare, surface: "bg-primary-100", tone: "text-primary-800" },
  { label: "In progress", value: "inProgress", icon: Clock, surface: "bg-accent-100", tone: "text-accent-800" },
  { label: "Waiting", value: "waiting", icon: AlertCircle, surface: "bg-amber-50", tone: "text-amber-700" },
  { label: "Unassigned", value: "unassigned", icon: User, surface: "bg-slate-100", tone: "text-slate-700" },
  { label: "High priority", value: "high", icon: AlertTriangle, surface: "bg-orange-50", tone: "text-orange-700" },
  { label: "Urgent", value: "urgent", icon: Zap, surface: "bg-rose-50", tone: "text-rose-700" },
] as const;

export function SupportStatsCards({ stats }: SupportStatsCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map(({ label, value, icon: Icon, surface, tone }) => (
        <Card key={value} className="rounded-2xl border-slate-200/80 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{stats[value]}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${surface} ${tone}`}>
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
