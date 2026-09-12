import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "default"
  | "secondary"
  | "destructive";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  primary: "bg-primary-50 text-primary-800 border-primary-200",
  success: "bg-amber-50 text-amber-900 border-amber-200",
  warning: "bg-accent-50 text-accent-800 border-accent-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
  secondary: "bg-slate-100 text-slate-700 border-slate-200",
  destructive: "bg-red-50 text-red-800 border-red-200",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * Small status label. Always paired with readable text (never color-only),
 * so information is not conveyed by color alone.
 */
export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
