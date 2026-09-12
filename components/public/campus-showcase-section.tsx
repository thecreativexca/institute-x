import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Monitor, Users2, Sparkles, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/container";

const facilities = [
  {
    title: "Dedicated Computer Training Labs",
    description: "Equipped with high-performance desktop terminals, high-speed fiber internet, and industry software for every enrolled learner.",
    image: "/images/course-basic-computer.jpg",
    badge: "Practical Training",
    icon: Monitor,
  },
  {
    title: "Interactive Smart Classrooms",
    description: "Air-conditioned lecture and presentation halls with digital projectors, comfortable seating, and audio-visual teaching aids.",
    image: "/images/classroom.jpg",
    badge: "Smart Learning",
    icon: Sparkles,
  },
  {
    title: "1-on-1 Mentor Guidance & Doubt Clearing",
    description: "Experienced faculty members guide students through practical difficulties, project bugs, and interview preparation.",
    image: "/images/guidance.jpg",
    badge: "Personal Attention",
    icon: Users2,
  },
  {
    title: "Collaborative Study & Resource Hub",
    description: "A vibrant library and collaboration space where students practice together, build portfolio projects, and discuss ideas.",
    image: "/images/learning.jpg",
    badge: "Peer Learning",
    icon: BookOpen,
  },
];

/**
 * Campus & Labs Showcase Section — gives prospective students a realistic,
 * trustworthy view of the institute's physical and learning environment.
 */
export function CampusShowcaseSection() {
  return (
    <section className="border-t border-primary-100 bg-[#ffffff] py-16 sm:py-24">
      <Container>
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Modern Infrastructure
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">
            Our Campus & State-of-the-Art Labs
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
            Experience an engaging, technology-driven learning environment built to give you real hands-on practice from day one.
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover"
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={f.image}
                    alt={f.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 rounded-full bg-primary-950/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    {f.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-bold text-primary-950">{f.title}</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campus Visit Banner */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 p-7 text-white shadow-card-hover sm:p-9 lg:flex lg:items-center lg:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-300">
              Visit Creative X Tycoon Institute
            </span>
            <h3 className="mt-1 text-2xl font-bold">Want to experience our classroom and labs in person?</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-100">
              Walk into our admissions office during working hours for a free campus tour, free career counseling, and a live demonstration session.
            </p>
          </div>
          <div className="mt-6 shrink-0 lg:mt-0">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-300 px-5 py-3 text-sm font-bold text-primary-950 shadow-md transition-colors hover:bg-accent-400"
            >
              Schedule a Campus Visit <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
