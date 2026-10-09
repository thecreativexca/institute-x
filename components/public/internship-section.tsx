import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarRange, FolderKanban } from "lucide-react";

import { Container } from "@/components/ui/container";

export function InternshipSection() {
  return (
    <section className="internship-home" aria-labelledby="internship-home-heading">
      <Container>
        <div className="internship-home-grid">
          <div className="internship-home-media" data-reveal>
            <Image
              src="/images/student-collaboration.jpg"
              alt="Students collaborating on a practical project"
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover"
            />
          </div>
          <div className="internship-home-copy" data-reveal>
            <span className="public-kicker">Learn through experience</span>
            <h2 id="internship-home-heading">Turn course skills into <em>project confidence.</em></h2>
            <p>
              Explore guided internship pathways built around practice, feedback and portfolio-ready work. Current
              students can review eligibility and active opportunities in their student portal.
            </p>
            <ul>
              <li><CalendarRange className="h-5 w-5" aria-hidden="true" /><span><strong>Focused timelines</strong>Short and extended pathways for different goals.</span></li>
              <li><FolderKanban className="h-5 w-5" aria-hidden="true" /><span><strong>Practical output</strong>Tasks, projects and milestones keep progress visible.</span></li>
              <li><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" /><span><strong>Portal connected</strong>Applications and assigned work stay in one place.</span></li>
            </ul>
            <Link href="/internship" className="public-button">
              Explore internships <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
