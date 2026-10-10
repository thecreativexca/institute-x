import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Braces, CalendarRange, CheckCircle2, ClipboardCheck, Code2, FolderKanban, GraduationCap, Lightbulb, Megaphone, Monitor, Palette, ShoppingCart, UserRoundCheck, UsersRound } from "lucide-react";

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
  { icon: GraduationCap, title: "Choose a pathway", body: "Review the available domain and understand what the active opportunity involves." },
  { icon: UserRoundCheck, title: "Apply", body: "Eligible signed-in students submit their application through the existing portal flow." },
  { icon: ClipboardCheck, title: "Application review", body: "The institute reviews the application against the opportunity requirements." },
  { icon: UsersRound, title: "Start the experience", body: "Approved learners begin the assigned tasks, milestones and project work." },
  { icon: FolderKanban, title: "Complete projects", body: "Submit the required work, track progress and receive the applicable evaluation." },
];

const domains = [
  { icon: Code2, title: "Web development", body: "Practice planning, building and improving digital projects." },
  { icon: Monitor, title: "Frontend development", body: "Work on interface structure, responsiveness and user-focused presentation." },
  { icon: Braces, title: "Programming", body: "Apply logic and problem-solving through structured technical tasks." },
  { icon: Palette, title: "Design & creative", body: "Develop visual work through briefs, feedback and iteration." },
  { icon: Megaphone, title: "Digital marketing", body: "Work through campaign, content and channel-focused tasks." },
  { icon: ShoppingCart, title: "E-commerce", body: "Explore product, store and digital selling workflows through practical tasks." },
];

export default function InternshipPage() {
  return (
    <>
      <section className="internship-hero">
        <Container>
          <div className="internship-hero-grid">
            <div data-reveal>
              <span className="public-kicker">Learn through experience</span>
              <h1>Turn learning into<br /><em>real experience.</em></h1>
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

      <section className="internship-value">
        <Container>
          <div className="internship-value-intro" data-reveal>
            <span className="public-kicker">What students gain</span>
            <h2>Experience that makes learning more concrete.</h2>
            <p>An internship pathway adds guided application to course knowledge. The exact tasks, dates and eligibility are shown for each active opportunity.</p>
          </div>
          <div className="internship-value-grid">
            <article data-reveal><Lightbulb className="h-6 w-6" aria-hidden="true" /><h3>Practical project experience</h3><p>Use a brief, work through milestones and produce an outcome that demonstrates the process you followed.</p></article>
            <article data-reveal><Code2 className="h-6 w-6" aria-hidden="true" /><h3>Practical skills</h3><p>Strengthen the techniques and tools connected to your chosen learning area.</p></article>
            <article data-reveal><UsersRound className="h-6 w-6" aria-hidden="true" /><h3>Team collaboration</h3><p>Understand how communication, shared responsibilities and clear handoffs support project work.</p></article>
            <article data-reveal><UserRoundCheck className="h-6 w-6" aria-hidden="true" /><h3>Mentorship and feedback</h3><p>Use guidance to spot gaps, improve your work and make the next attempt stronger.</p></article>
            <article data-reveal><Palette className="h-6 w-6" aria-hidden="true" /><h3>Portfolio development</h3><p>Create project outputs that can help demonstrate how you approached a practical brief.</p></article>
            <article data-reveal><FolderKanban className="h-6 w-6" aria-hidden="true" /><h3>Professional workflow</h3><p>Practise managing tasks, meeting requirements, documenting progress and submitting work clearly.</p></article>
          </div>
        </Container>
      </section>

      <section className="internship-domains">
        <Container>
          <div className="education-section-heading">
            <div><span className="public-kicker">Available domains</span><h2>Practice in the area you are building.</h2></div>
            <p>Domains depend on current institute opportunities. Check the student portal or contact the team for what is presently open.</p>
          </div>
          <div className="internship-domain-grid">
            {domains.map(({ icon: Icon, title, body }) => <article key={title} data-reveal><Icon className="h-6 w-6" aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </Container>
      </section>

      <section className="internship-eligibility">
        <Container>
          <div data-reveal><span className="public-kicker">Who can apply</span><h2>A pathway for learners ready to practise consistently.</h2></div>
          <ul data-reveal>
            {["Students who want practical exposure", "Freshers exploring a professional workflow", "Beginners building on relevant foundations", "Skill learners ready to complete guided work"].map((item) => <li key={item}><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{item}</li>)}
          </ul>
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
          <div className="internship-enquiry-copy" data-reveal><span className="public-kicker">Ready to gain practical experience?</span><h2>Ask about the right pathway.</h2><p>Tell the team what you are learning and the kind of experience you want. Your question will appear in the institute request portal.</p><Link href="/courses" className="public-button-dark mt-8">Explore Courses <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
          <div data-reveal><RequestForm type="contact" /></div>
        </Container>
      </section>
    </>
  );
}
