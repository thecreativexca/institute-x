import { Star, Quote, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";

const testimonials = [
  {
    name: "Rahul Verma",
    course: "MERN Full-Stack Web Development",
    year: "Batch 2024",
    role: "Junior Web Developer",
    content:
      "The practical lab training here is unmatched. Instead of just theory, we built real REST APIs, databases, and React frontends. The faculty supported me through every doubt.",
    rating: 5,
  },
  {
    name: "Sneha Patel",
    course: "TallyPrime + Corporate Accounting",
    year: "Batch 2024",
    role: "Accounts Executive",
    content:
      "As a commerce graduate, I needed practical GST and voucher entry skills. The hands-on practice on real business transactions helped me crack my job interview with confidence.",
    rating: 5,
  },
  {
    name: "Aman Sharma",
    course: "Advanced Graphic Design & UI/UX",
    year: "Batch 2024",
    role: "Creative Designer",
    content:
      "The design studio atmosphere, access to drawing tablets, and regular feedback from the mentors pushed my creativity to professional agency standards. Highly recommend this institute!",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-primary-100 bg-white py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-800">
            Student Success Stories
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">
            Hear From Our Alumni & Students
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Real experiences from learners who transformed their careers with practical education at Creative X Tycoon Institute.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative flex flex-col justify-between rounded-2xl border border-primary-100 bg-gradient-to-b from-white to-primary-50/30 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div>
                {/* Rating & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                  <Quote className="h-6 w-6 text-primary-200" aria-hidden="true" />
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-700 italic">
                  &ldquo;{t.content}&rdquo;
                </p>
              </div>

              <div className="mt-6 border-t border-primary-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-primary-950 flex items-center gap-1.5">
                      {t.name}
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    </h3>
                    <p className="text-xs text-primary-700 font-medium">{t.role}</p>
                  </div>
                  <span className="rounded-md bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-primary-900">
                    {t.year}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{t.course}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
