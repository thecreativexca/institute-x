import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarRange, ClipboardCheck, FolderKanban, GraduationCap, UserRoundCheck } from "lucide-react";

import { RequestForm } from "@/components/public/request-form";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Internship & Practical Experience",
  description: `Explore guided project and internship pathways at ${siteConfig.name}, including short focused practice and extended portfolio development.`,
};

const pathways = [
  {
    title: "6-week focused pathway",
    label: "Short experience",
    description: "A structured introduction for learners who want to practise a focused skill through guided tasks and a practical project.",
    points: ["Suitable for students and beginners", "Weekly tasks and a defined project", "Guidance through the student portal"],
    image: "/images/coding-laptop.jpg",
  },
  {
    title: "6-month extended pathway",
    label: "Deeper experience",
    description: "A longer journey for committed learners who want more time for consistent practice, larger projects and portfolio development.",
    points: ["Designed for deeper skill development", "Projects, milestones and evaluations", "More time to build demonstrable work"],
    image: "/images/student-collaboration-new.jpg",
  },
];

const journey = [
  { icon: GraduationCap, title: "Build foundations", body: "Complete the relevant learning path or meet the published eligibility requirements." },
  { icon: ClipboardCheck, title: "Review eligibility", body: "Active opportunities show their dates, seats, mode and required course progress in the portal." },
  { icon: UserRoundCheck, title: "Apply or join", body: "Eligible students apply from their account; approval rules are handled by the existing internship system." },
  { icon: FolderKanban, title: "Complete the work", body: "Submit assigned tasks and projects, track milestones and receive an evaluation." },
];

export default function InternshipPage() {
  return (
    <>
      <section className="internship-hero">
        <Container>
          <div className="internship-hero-grid">
            <div data-reveal>
              <span className="public-kicker">Learn through experience</span>
              <h1>Build projects.<br /><em>Build confidence.</em></h1>
              <p>Guided internship pathways connect course learning with tasks, projects, milestones and real progress inside the student portal.</p>
              <div className="internship-hero-actions">
                <Link href="/student/internships" className="public-button">View student opportunities <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                <Link href="#internship-enquiry" className="public-button-line">Ask a question</Link>
              </div>
            </div>
            <div className="internship-hero-image" data-reveal>
              <Image src="/images/learning-together.jpg" alt="Students learning practical computer skills in a classroom" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
              <div><CalendarRange className="h-5 w-5" aria-hidden="true" /><span><strong>Structured experience</strong>Tasks, projects and milestones</span></div>
            </div>
          </div>
        </Container>
      </section>

      <section className="internship-pathways">
        <Container>
          <div className="education-section-heading">
            <div><span className="public-kicker">Pathways at a glance</span><h2>Choose the depth that fits your goal.</h2></div>
            <p>Availability, eligibility, dates and outcomes are confirmed for each active opportunity in the student portal.</p>
          </div>
          <div className="internship-pathway-grid">
            {pathways.map((pathway) => (
              <article key={pathway.title} data-reveal>
                <div className="internship-pathway-image"><Image src={pathway.image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>
                <div className="internship-pathway-body">
                  <span>{pathway.label}</span><h3>{pathway.title}</h3><p>{pathway.description}</p>
                  <ul>{pathway.points.map((point) => <li key={point}><BadgeCheck className="h-4 w-4" aria-hidden="true" />{point}</li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="internship-journey">
        <Container>
          <span className="public-kicker">From course to experience</span>
          <h2>How the internship journey works.</h2>
          <ol>
            {journey.map(({ icon: Icon, title, body }, index) => <li key={title} data-reveal><span>0{index + 1}</span><Icon className="h-6 w-6" aria-hidden="true" /><h3>{title}</h3><p>{body}</p></li>)}
          </ol>
        </Container>
      </section>

      <section id="internship-enquiry" className="internship-enquiry">
        <Container>
          <div className="internship-enquiry-copy" data-reveal><span className="public-kicker">Need guidance?</span><h2>Ask about the right pathway.</h2><p>Tell the team what you are learning and the kind of experience you want. Your question will appear in the institute request portal.</p></div>
          <div data-reveal><RequestForm type="contact" /></div>
        </Container>
      </section>
    </>
  );
}
