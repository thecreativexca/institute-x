import { forwardRef, type ButtonHTMLAttributes, type ReactElement, isValidElement, cloneElement } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors select-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:outline-primary-600",
  secondary:
    "bg-primary-50 text-primary-800 hover:bg-primary-100 active:bg-primary-200 focus-visible:outline-primary-600",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-slate-500",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:outline-slate-500",
  danger:
    "bg-red-700 text-white hover:bg-red-800 active:bg-red-900 focus-visible:outline-red-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm sm:text-base",
  lg: "h-12 px-6 text-base",
};

/** Class builder exported so <Link>/<a> can render button-styled elements. */
export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables interaction while an action runs. */
  isLoading?: boolean;
  /** Render as a different element (e.g., Link) while preserving button styles. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", isLoading = false, disabled, children, type, asChild, ...props },
  ref
) {
  if (asChild) {
    if (!isValidElement(children)) {
      return <button disabled>Invalid asChild usage</button>;
    }

    const child = children as ReactElement<Record<string, unknown>>;
    const computedClassName = buttonVariants(variant, size, className);
    const childClassName = (child.props.className as string) ?? "";

    // eslint-disable-next-line react-hooks/refs
    return cloneElement(child, {
      ...child.props,
      className: cn(computedClassName, childClassName),
      disabled: disabled ?? isLoading ?? child.props.disabled,
      "aria-busy": isLoading || child.props["aria-busy"],
    });
  }

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={buttonVariants(variant, size, className)}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
