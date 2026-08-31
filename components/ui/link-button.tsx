"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ChevronRight } from "lucide-react";

interface LinkButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper around Next.js Link styled as a Button.
 * This avoids TypeScript issues with next/link default export.
 */
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  children,
  className,
}: LinkButtonProps) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(className)}
    >
      <Link href={href}>
        {children}
      </Link>
    </Button>
  );
}

interface LinkWrapperProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

/**
 * Simple wrapper around Next.js Link for use in non-button contexts.
 */
export function LinkWrapper({
  href,
  children,
  className,
  onClick,
}: LinkWrapperProps) {
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}