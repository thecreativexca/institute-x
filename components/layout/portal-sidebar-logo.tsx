import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/config/site";

interface PortalSidebarLogoProps {
  href: string;
}

export function PortalSidebarLogo({ href }: PortalSidebarLogoProps) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} — Portal home`}
      className="group inline-flex h-11 w-[6.75rem] shrink-0 items-center justify-start rounded-lg transition-opacity duration-200 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950 motion-reduce:transition-none"
    >
      <Image
        src={siteConfig.logo}
        alt={siteConfig.name}
        width={951}
        height={392}
        priority
        sizes="108px"
        className="h-10 w-auto object-contain transition-transform duration-200 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
      />
    </Link>
  );
}
