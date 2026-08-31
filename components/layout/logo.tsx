import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

export interface LogoProps {
  /** Render the full wordmark or just the icon. */
  variant?: "full" | "icon";
  tone?: "default" | "inverse";
  className?: string;
}

/** Institute logo linking home. Uses the centralized site configuration. */
export function Logo({ variant = "full", tone = "default", className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — Home`}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <Image
        src={siteConfig.logo}
        alt=""
        width={40}
        height={40}
        priority
        className="h-10 w-10 rounded-lg"
      />
      {variant === "full" ? (
        <span className="flex flex-col leading-tight">
          <span
            className={cn(
              "text-base font-semibold tracking-tight",
              tone === "inverse" ? "text-white" : "text-slate-900"
            )}
          >
            {siteConfig.name}
          </span>
          <span
            className={cn(
              "hidden text-xs sm:block",
              tone === "inverse" ? "text-primary-100" : "text-slate-500"
            )}
          >
            Skill Development &amp; Training
          </span>
        </span>
      ) : null}
    </Link>
  );
}
