"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };

export interface FieldShellProps {
  label: string;
  optionalLabel?: string;
  hint?: string;
  error?: string;
  id: string;
  /** Marks the label with a visual required indicator. */
  required?: boolean;
  children: React.ReactNode;
}

export function FieldShell({
  label,
  optionalLabel,
  hint,
  error,
  id,
  required,
  children,
}: FieldShellProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
        {optionalLabel ? (
          <span className="ml-1 font-normal text-slate-500">({optionalLabel})</span>
        ) : null}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function useFieldId(explicitName?: string): string {
  const autoId = React.useId();
  return explicitName ?? autoId;
}

export const controlBaseStyles =
  "w-full rounded-md border bg-white px-3 text-slate-900 placeholder:text-slate-400 transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-primary-600/40 disabled:cursor-not-allowed disabled:bg-slate-100";

export const controlNormal = "border-slate-300 hover:border-slate-400";
export const controlInvalid = "border-red-500 focus:ring-red-600/30";

export function controlClassName(error?: boolean, extra?: string): string {
  return cn(controlBaseStyles, error ? controlInvalid : controlNormal, extra);
}