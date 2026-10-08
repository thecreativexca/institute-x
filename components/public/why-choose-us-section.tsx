import { ClipboardCheck, Clock3, LibraryBig, MonitorPlay, Route, UserRoundCheck } from "lucide-react";

import { Container } from "@/components/ui/container";

const features = [
  { icon: Route, title: "Structured learning paths", body: "Move through modules and lessons in a clear sequence." },
  { icon: MonitorPlay, title: "Video-based lessons", body: "Watch course lessons from your online student portal." },
  { icon: ClipboardCheck, title: "Practice and assessment", body: "Use assignments and quizzes when they are included in a course." },
  { icon: Clock3, title: "Flexible learning", body: "Return to your available course material around your schedule." },
  { icon: LibraryBig, title: "Resources in one place", body: "Keep course material connected to the lesson it supports." },
  { icon: UserRoundCheck, title: "Progress visibility", body: "See completed lessons and learning activity in your account." },
];

export function WhyChooseUsSection() {
  return (
    <section className="education-benefits" aria-labelledby="benefits-heading">
      <Container>
        <div className="education-section-heading education-section-heading-center" data-reveal>
          <div><span className="education-eyebrow">Why learn with us</span><h2 id="benefits-heading">Designed around how students actually learn</h2></div>
          <p>Simple tools, clear structure and practical activity help you spend less time navigating and more time learning.</p>
        </div>
        <ul className="education-benefit-grid" data-reveal>
          {features.map(({ icon: Icon, title, body }) => <li key={title}><span><Icon className="h-6 w-6" /></span><h3>{title}</h3><p>{body}</p></li>)}
        </ul>
      </Container>
    </section>
  );
}
