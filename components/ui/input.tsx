"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import {
  controlClassName,
  FieldShell,
  useFieldId,
} from "@/components/ui/field";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "aria-describedby" | "aria-invalid"> {
  label?: string;
  optionalLabel?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, optionalLabel, hint, error, className, name, required, icon, id, ...props },
  ref
) {
  const generatedId = useFieldId(name);
  const inputId = id ?? generatedId;
  return (
    <FieldShell label={label ?? ""} optionalLabel={optionalLabel} hint={hint} error={error} id={inputId}>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={controlClassName(
            Boolean(error),
            "h-10 text-sm sm:text-base " + (icon ? "pl-10 " : "") + (className ?? "")
          )}
          {...props}
        />
      </div>
    </FieldShell>
  );
});
