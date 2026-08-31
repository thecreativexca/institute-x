"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

import {
  controlClassName,
  FieldShell,
  useFieldId,
} from "@/components/ui/field";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "aria-describedby" | "aria-invalid"> {
  label?: string;
  optionalLabel?: string;
  hint?: string;
  error?: string;
  id?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, optionalLabel, hint, error, className, name, required, rows = 4, id, ...props },
    ref
  ) {
    const generatedId = useFieldId(name);
    const textareaId = id ?? generatedId;
    return (
      <FieldShell label={label ?? ""} optionalLabel={optionalLabel} hint={hint} error={error} id={textareaId}>
        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          className={controlClassName(
            Boolean(error),
            "py-2 text-sm sm:text-base " + (className ?? "")
          )}
          {...props}
        />
      </FieldShell>
    );
  }
);
