import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

export interface LogoProps {
  variant?: "full" | "compact" | "auth";
  className?: string;
  href?: string;
}

const sizeByVariant = {
  compact: "h-9 w-auto sm:h-10",
  full: "h-10 w-auto sm:h-11",
  auth: "h-12 w-auto sm:h-14",
} as const;

export function Logo({
  variant = "full",
  className,
  href = "/",
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} — Home`}
      className={cn("inline-flex min-w-0 items-center", className)}
    >
      <Image
        src={siteConfig.logo}
        alt={siteConfig.name}
        width={320}
        height={80}
        priority
        className={cn("max-w-none object-contain", sizeByVariant[variant])}
      />
    </Link>
  );
}
