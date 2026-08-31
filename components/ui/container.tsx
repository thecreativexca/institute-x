import type { ElementType, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Render as a different semantic element (defaults to <div>). */
  as?: ElementType;
}

/**
 * Page-width container. Keeps content centered with responsive gutters
 * across 320px → 1440px+ viewports without horizontal overflow.
 */
export function Container({ className, children, as: Tag = "div", ...props }: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
