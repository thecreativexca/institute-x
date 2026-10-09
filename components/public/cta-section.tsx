import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { Container } from "@/components/ui/container";

export function CtaSection() {
  return (
    <section className="education-cta" aria-labelledby="cta-heading">
      <Container>
        <div className="education-cta-card">
          <div className="education-cta-copy" data-reveal>
            <span className="education-eyebrow"><BookOpenCheck className="h-4 w-4" /> Start learning</span>
            <h2 id="cta-heading">Your next practical skill could start today.</h2>
            <p>Explore the current catalog, review the full syllabus and choose the course that fits your goal. Send a request and our admissions team will guide you.</p>
            <div>
              <Link href="/courses" className="education-amber-button">Explore courses <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/admission" className="education-outline-button">Start admission enquiry</Link>
            </div>
          </div>
          <div className="education-cta-image">
            <Image src="/images/student-collaboration-new.jpg" alt="Students collaborating and learning together on a project" fill sizes="(max-width: 900px) 100vw, 40vw" className="object-cover" />
          </div>
        </div>
      </Container>
    </section>
  );
}
