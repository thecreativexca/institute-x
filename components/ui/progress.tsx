import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value from 0 to 100 */
  value: number;
  /** Show the value as text inside the progress bar */
  showValue?: boolean;
}

export function Progress({ className, value, showValue = false, ...props }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
      {...props}
    >
      <div
        className="h-full bg-primary-600 transition-all duration-300 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
      {showValue && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}