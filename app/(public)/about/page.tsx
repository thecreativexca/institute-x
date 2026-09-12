import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  Users2,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "About Our Institute — Mission, Campus & Faculty",
  description:
    "Learn about Creative X Tycoon Institute, our practical hands-on educational approach, state-of-the-art campus facilities, and experienced mentors.",
};

const approachPoints = [
  {
    icon: BookOpenCheck,
    title: "100% Practical & Lab-First",
    description: "Every theoretical lecture is paired with real software practice on dedicated desktop terminals.",
  },
  {
    icon: Lightbulb,
    title: "Project-Based Portfolio",
    description: "Students graduate having built actual websites, financial ledgers, design brandkits, or business reports.",
  },
  {
    icon: Users2,
    title: "Dedicated Faculty Mentorship",
    description: "Experienced industry trainers provide personalized doubt-clearing sessions and career guidance.",
  },
  {
    icon: Award,
    title: "Verifiable Certifications",
    description: "Globally verifiable credentials equipped with unique serial IDs and instant QR validation for employers.",
  },
];

const facultyMembers = [
  {
    name: "Priya Sharma",
    designation: "Head of Computer Fundamentals & Office Tech",
    experience: "10+ Years Experience",
    bio: "Specialist in Microsoft Office, enterprise data workflows, and computer literacy pedagogy for beginner learners.",
  },
  {
    name: "CA Vikram Singh",
    designation: "Lead Trainer, Accounting & Taxation",
    experience: "12+ Years Experience",
    bio: "Practicing Chartered Accountant and Tally Certified Trainer with expertise in GST, audit, and corporate bookkeeping.",
  },
  {
    name: "Meera Nair",
    designation: "Senior UI/UX Designer & Web Faculty",
    experience: "8+ Years Experience",
    bio: "Frontend engineer and digital product designer passionate about clean code, responsive layouts, and Figma prototyping.",
  },
  {
    name: "Rajesh Kumar",
    designation: "Specialist in Typing Speed & Data Operations",
    experience: "7+ Years Experience",
    bio: "Pioneer in touch typing methodologies and data entry precision for government and private enterprise roles.",
  },
];

const campusPhotos = [
  {
    src: "/images/campus-reception.jpg",
    title: "Welcoming Campus Lobby & Reception",
    subtitle: "Student counseling desk and awards showcase",
  },
  {
    src: "/images/course-basic-computer.jpg",
    title: "Central High-Tech Computer Lab",
    subtitle: "Individual desktop terminals with high-speed internet",
  },
  {
    src: "/images/classroom.jpg",
    title: "Interactive Smart Classrooms",
    subtitle: "Audio-visual projectors and comfortable lecture seating",
  },
  {
    src: "/images/learning.jpg",
    title: "Collaborative Study & Project Lounge",
    subtitle: "Peer learning environment and reference library",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="public-hero-pattern relative overflow-hidden border-b border-primary-100 bg-gradient-to-b from-primary-50/70 via-white to-white">
        <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-40" />
        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300 bg-accent-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-900">
                <Building2 className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
                About Creative X Tycoon Institute
              </span>
              <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-[-0.035em] text-primary-950 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
                Practical Education Built Around Real Careers.
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600">
                Founded with a steadfast commitment to bridging the gap between theoretical knowledge and practical workplace requirements,
                <strong> {siteConfig.name}</strong> has empowered thousands of learners with job-ready technical, accounting, design, and digital skills.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/courses" className={buttonVariants("primary", "lg", "rounded-xl font-semibold shadow-md")}>
                  Explore Our Programs <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className={buttonVariants("outline", "lg", "rounded-xl border-primary-200 bg-white text-primary-950 hover:bg-primary-50 font-semibold")}
                >
                  Visit Our Campus
                </Link>
              </div>
            </div>

            {/* Visual Hero Image Grid */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-accent-200 to-primary-200 opacity-60 blur-xl -z-10"
              />
              <div className="relative overflow-hidden rounded-[2rem] border-2 border-white bg-white p-2 shadow-card-hover">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/images/classroom.jpg"
                    alt="Students attending an interactive session at Creative X Tycoon Institute"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">Smart Classroom & Labs</p>
                    <p className="text-base font-bold">Interactive Learning with Personal Attention</p>
                  </div>
                </div>
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-primary-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-md">
                <p className="text-2xl font-extrabold text-primary-950">10,000+</p>
                <p className="text-xs font-medium text-slate-600">Alumni in Industry</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Institute Story & Mission */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[2rem] border border-primary-100 shadow-card">
                <Image
                  src="/images/guidance.jpg"
                  alt="Faculty mentoring students on computer applications"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Our Vision & Purpose</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-950 sm:text-4xl">
                Skill Development That Truly Empowers You
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                At Creative X Tycoon Institute, we believe that education should not be confined to memorizing notes.
                Modern workplaces demand practical competence — whether it is filing a GST return in TallyPrime, building a full-stack web application, designing marketing creatives, or operating office software with speed.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Our institute maintains an optimal student-to-mentor ratio, modern desktop hardware for every student, and a continuous assessment framework that guarantees measurable progress.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
                  <Target className="h-6 w-6 text-primary-700 mb-2" aria-hidden="true" />
                  <h3 className="font-bold text-sm text-primary-950">Targeted Curriculum</h3>
                  <p className="text-xs text-slate-600 mt-1">Updated every 6 months to reflect current hiring standards.</p>
                </div>
                <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 mb-2" aria-hidden="true" />
                  <h3 className="font-bold text-sm text-primary-950">Quality Certified</h3>
                  <p className="text-xs text-slate-600 mt-1">ISO 9001:2015 standard training and verification system.</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Campus Infrastructure Gallery */}
      <section className="border-t border-primary-100 bg-gradient-to-b from-primary-50/50 to-white py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-800">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Campus Facilities
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">
              Take a Virtual Tour of Our Infrastructure
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Explore the dedicated training labs, lecture spaces, and collaborative student lounges at our center.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {campusPhotos.map((photo) => (
              <div
                key={photo.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm text-primary-950">{photo.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{photo.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Approach Points */}
      <section className="bg-white py-16 sm:py-20 border-t border-primary-100">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Educational Pillars</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-950 sm:text-4xl">
              Why Students Excel at Our Institute
            </h2>
          </div>

          <ul className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {approachPoints.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-800">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-3xl font-extrabold text-accent-300">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-bold text-primary-950">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Faculty Profiles Section */}
      <section className="border-t border-primary-100 bg-primary-50/40 py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-800">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Expert Educators
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">
              Meet Our Senior Faculty & Mentors
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Learn directly from certified professionals, practicing accountants, and veteran software developers who bring industry experience into every classroom.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facultyMembers.map((faculty) => (
              <div
                key={faculty.name}
                className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-900 to-primary-700 text-white font-bold text-xl shadow-md">
                  {faculty.name[0]}
                </div>
                <h3 className="mt-4 text-base font-bold text-primary-950">{faculty.name}</h3>
                <p className="text-xs font-semibold text-primary-700 mt-0.5">{faculty.designation}</p>
                <span className="inline-block mt-2 rounded bg-accent-100 px-2 py-0.5 text-[11px] font-medium text-primary-950">
                  {faculty.experience}
                </span>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">{faculty.bio}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Call to Action Bar */}
      <section className="border-t border-primary-100 bg-white py-14 sm:py-16">
        <Container>
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 rounded-[2rem] border border-primary-200 bg-gradient-to-r from-primary-950 to-primary-900 p-8 text-center text-white shadow-card-hover sm:p-10 lg:flex-row lg:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent-300">Admissions & Campus Tours Open</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">Start Your Learning Journey Today</h2>
              <p className="mt-2 text-sm text-primary-100 max-w-xl">
                Visit our campus for a personalized demo class or consult with our counselors online.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/courses" className="inline-flex items-center justify-center rounded-xl bg-accent-300 px-6 py-3 text-sm font-bold text-primary-950 hover:bg-accent-400 transition-colors">
                Browse Courses <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-primary-700 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors">
                Contact Office
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
