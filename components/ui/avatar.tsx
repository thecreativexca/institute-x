import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <div
      className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AvatarImageProps extends HTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
}

export function AvatarImage({ className, src, alt, ...props }: AvatarImageProps) {
  if (!src) return null;

  // Avatar URLs can come from the institute's configured media provider.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={cn("aspect-square h-full w-full object-cover", className)} src={src} alt={alt ?? ""} {...props} />;
}

export interface AvatarFallbackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
}

export function AvatarFallback({ className, children, delay, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium",
        className
      )}
      style={{ animationDelay: `${delay ?? 0}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}
