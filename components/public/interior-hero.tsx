import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/ui/container";

interface InteriorHeroProps {
  kicker: string;
  title: ReactNode;
  description: string;
  imageSrc: string;
  imageAlt: string;
  actions?: Array<{ label: string; href: string; variant?: "primary" | "outline" }>;
  imageNote?: string;
}

export function InteriorHero({ kicker, title, description, imageSrc, imageAlt, actions = [], imageNote }: InteriorHeroProps) {
  return (
    <section className="interior-hero">
      <Container>
        <div className="interior-hero-grid">
          <div className="interior-hero-copy" data-reveal>
            <span className="public-kicker">{kicker}</span>
            <h1>{title}</h1>
            <p>{description}</p>
            {actions.length ? <div className="interior-hero-actions">{actions.map((action) => <Link key={action.href} href={action.href} className={action.variant === "outline" ? "public-button-line" : "public-button-dark"}>{action.label}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>)}</div> : null}
          </div>
          <div className="interior-hero-media" data-reveal>
            <Image src={imageSrc} alt={imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
            {imageNote ? <div className="interior-hero-note"><span>Practical learning</span><strong>{imageNote}</strong></div> : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
