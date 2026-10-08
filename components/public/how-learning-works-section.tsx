import { CheckCircle2, ClipboardPenLine, Compass, Play, Send } from "lucide-react";

import { Container } from "@/components/ui/container";

const steps = [
  { icon: Compass, title: "Discover", body: "Search the catalog and compare course details." },
  { icon: Send, title: "Request admission", body: "Share your details and let our team guide the next step." },
  { icon: Play, title: "Watch lessons", body: "Follow video lessons in their module order." },
  { icon: ClipboardPenLine, title: "Practise", body: "Complete the activities and assessments provided." },
  { icon: CheckCircle2, title: "Track progress", body: "See what you have finished and what comes next." },
];

export function HowLearningWorksSection() {
  return (
    <section className="education-journey" aria-labelledby="journey-heading">
      <Container>
        <div className="education-section-heading" data-reveal>
          <div><span className="education-eyebrow">Your learning journey</span><h2 id="journey-heading">From finding a course to making progress</h2></div>
          <p>A simple, repeatable path keeps every part of the experience understandable from day one.</p>
        </div>
        <ol className="education-journey-list" data-reveal>
          {steps.map(({ icon: Icon, title, body }, index) => <li key={title}><span className="education-step-number">{index + 1}</span><span className="education-step-icon"><Icon className="h-5 w-5" /></span><h3>{title}</h3><p>{body}</p></li>)}
        </ol>
      </Container>
    </section>
  );
}
