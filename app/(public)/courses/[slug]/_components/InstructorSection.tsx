import Image from "next/image";
import type { CatalogInstructor } from "@/lib/config/catalog";

interface InstructorSectionProps {
  instructor?: CatalogInstructor;
}

export function InstructorSection({ instructor }: InstructorSectionProps) {
  if (!instructor) {
    return (
      <section aria-labelledby="instructor-heading" className="space-y-4">
        <h2 id="instructor-heading" className="text-2xl font-semibold text-slate-900">
          Instructor
        </h2>
        <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-8 text-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto h-12 w-12 text-slate-300"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="mt-4 text-slate-600">
            Instructor information will be available soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="instructor-heading" className="space-y-4">
      <h2 id="instructor-heading" className="text-2xl font-semibold text-slate-900">
        Instructor
      </h2>
      <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative h-24 w-24 flex-shrink-0 rounded-full overflow-hidden bg-surface-inset">
            {instructor.imageUrl ? (
              <Image
                src={instructor.imageUrl}
                alt={instructor.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-10 w-10 text-primary-300"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold text-slate-900">{instructor.name}</h3>
            <p className="text-primary-600 font-medium">{instructor.designation}</p>
            {instructor.expertise && instructor.expertise.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1.5">
                {instructor.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-slate-700 leading-relaxed">{instructor.bio}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
