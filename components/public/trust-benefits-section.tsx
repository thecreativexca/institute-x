import Image from "next/image";
import { CheckCircle2, PlayCircle } from "lucide-react";

import { Container } from "@/components/ui/container";

const supportedFeatures = [
  "Structured modules that keep topics in a clear order",
  "Video lessons available inside the student learning portal",
  "Assignments and quizzes included where a course provides them",
  "Lesson completion and learning progress tracking",
];

export function TrustBenefitsSection() {
  return (
    <section className="education-platform" aria-labelledby="platform-heading">
      <Container>
        <div className="education-platform-grid">
          <div className="education-platform-visual" data-reveal>
            <Image src="/images/online-learning.jpg" alt="A student learning online with a laptop — modern digital education" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
            <div className="education-video-badge"><PlayCircle className="h-6 w-6" /><span><small>Learn step by step</small><strong>Lessons organised by module</strong></span></div>
          </div>
          <div className="education-platform-copy" data-reveal>
            <span className="education-eyebrow">A real learning experience</span>
            <h2 id="platform-heading">Everything you need to keep learning on track.</h2>
            <p>Course content is not scattered across links and messages. Your learning activity stays organised inside one student portal.</p>
            <ul>
              {supportedFeatures.map((feature) => <li key={feature}><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{feature}</li>)}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
