"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_FALLBACK_MS = 4_000;

/** Adds one lightweight, progressive enhancement for editorial scroll reveals. */
export function PublicMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!items.length) return;

    const revealAll = () => {
      items.forEach((item) => item.classList.add("is-revealed"));
    };
    const resetRevealClasses = () => {
      items.forEach((item) => item.classList.remove("public-reveal-pending", "is-revealed"));
    };

    resetRevealClasses();

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof window.IntersectionObserver !== "function"
    ) {
      return;
    }

    let observer: IntersectionObserver | undefined;
    let fallbackTimer: number | undefined;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              observer?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8%", threshold: 0.08 }
      );

      items.forEach((item) => {
        item.classList.add("public-reveal-pending");
        observer?.observe(item);
      });

      // IntersectionObserver is progressive enhancement. If a browser stops
      // delivering callbacks, content must still become visible without a reload.
      fallbackTimer = window.setTimeout(revealAll, REVEAL_FALLBACK_MS);
    } catch {
      revealAll();
    }

    return () => {
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      observer?.disconnect();
      revealAll();
    };
  }, [pathname]);

  return null;
}
