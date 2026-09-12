"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export type AlertVariant = "default" | "destructive" | "success" | "warning";

const variantStyles: Record<AlertVariant, string> = {
  default: "border-blue-200 bg-blue-50 text-blue-800",
  destructive: "border-red-200 bg-red-50 text-red-800",
  success: "border-amber-200 bg-amber-50 text-amber-900",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  default: <Info className="h-4 w-4" />,
  destructive: <AlertCircle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  onClose?: () => void;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  function Alert({ className, variant = "default", onClose, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative rounded-lg border p-4",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0" aria-hidden="true">
            {variantIcons[variant]}
          </div>
          <div className="flex-1">{children}</div>
          {onClose && (
            <button
              type="button"
              className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
              onClick={onClose}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

export type AlertTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  function AlertTitle({ className, ...props }, ref) {
    return (
      <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none", className)}
        {...props}
      />
    );
  }
);

export type AlertDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const AlertDescription = forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  function AlertDescription({ className, ...props }, ref) {
    return (
      <p ref={ref} className={cn("text-sm", className)} {...props} />
    );
  }
);