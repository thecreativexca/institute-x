import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Student Learning Experience Preview — LMS dashboard mockup.
 * Shows what students will see inside the learning portal.
 * Pure visual preview; no functional interactivity.
 */
export function StudentDashboardPreviewSection() {
  return (
    <section
      aria-labelledby="dashboard-preview-heading"
      className="border-y border-primary-100 bg-[#ffffff]"
    >
      <Container className="py-16 sm:py-24">
        <SectionHeading
          eyebrow="Student portal preview"
          title="Your personalized learning dashboard"
          description="A glimpse of the student experience — courses, progress, and assessments in one place."
        />
        <div className="mx-auto mt-12 max-w-6xl">
          <div className="overflow-hidden rounded-[1.75rem] border border-primary-100 bg-primary-50/60 shadow-card-hover">
            {/* Sidebar + Main content layout */}
            <div className="flex flex-col lg:flex-row">
              {/* Sidebar */}
              <aside
                className="hidden w-64 border-r border-primary-100 bg-white lg:block"
                aria-label="Student navigation"
              >
                <nav className="p-4">
                  <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    My Learning
                  </p>
                  <ul className="flex flex-col gap-1" role="list">
                    {[
                      { label: "My Courses", active: true, icon: "book" },
                      { label: "Progress", active: false, icon: "chart" },
                      { label: "Assignments", active: false, icon: "file" },
                      { label: "Certificates", active: false, icon: "award" },
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            item.active
                              ? "bg-primary-50 text-primary-800"
                              : "text-slate-600 hover:bg-primary-50 hover:text-primary-900"
                          }`}
                          aria-current={item.active ? "page" : undefined}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-5 w-5"
                          >
                            {item.icon === "book" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            )}
                            {item.icon === "chart" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            )}
                            {item.icon === "file" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            )}
                            {item.icon === "award" && (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            )}
                          </svg>
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

              {/* Main content */}
              <main className="flex-1 p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-primary-700">
                    Welcome back, <span className="font-semibold text-slate-900">Priya Sharma</span>
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                    My Courses
                  </h1>
                </div>

                {/* Course cards grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    {
                      title: "MERN Stack Development",
                      instructor: "Rajesh Kumar",
                      progress: 45,
                      nextLesson: "Module 3: Building REST APIs with Express",
                      thumbnail:
                        "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop",
                    },
                    {
                      title: "Digital Marketing",
                      instructor: "Anita Desai",
                      progress: 78,
                      nextLesson: "Module 4: Social Media Advertising",
                      thumbnail:
                        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
                    },
                    {
                      title: "Graphic Design",
                      instructor: "Vikram Singh",
                      progress: 22,
                      nextLesson: "Module 1: Design Principles & Color Theory",
                      thumbnail:
                        "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=225&fit=crop",
                    },
                    {
                      title: "Python Programming",
                      instructor: "Dr. Meera Patel",
                      progress: 65,
                      nextLesson: "Module 5: Working with Databases",
                      thumbnail:
                        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=225&fit=crop",
                    },
                  ].map((course, index) => (
                    <article
                      key={index}
                      className="relative flex flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={course.thumbnail}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-medium text-white">
                              {course.progress}% complete
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-xs text-slate-500">{course.instructor}</p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900 line-clamp-1">
                          {course.title}
                        </h3>
                        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden flex-1">
                          <div
                            className="h-full rounded-full bg-primary-600 transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-1">
                          Next: {course.nextLesson}
                        </p>
                        <button className="mt-auto text-sm font-medium text-primary-700 hover:text-primary-800">
                          Continue Learning →
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Quick stats row */}
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Total Courses", value: "4" },
                    { label: "Hours Learned", value: "42h" },
                    { label: "Quizzes Passed", value: "8" },
                    { label: "Certificates", value: "1" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-primary-100 bg-white p-4 text-center"
                    >
                      <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                        {stat.value}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Sign in to your student account to access enrolled courses, progress,
            assignments, quizzes, payments, and certificates.
          </p>
        </div>
      </Container>
    </section>
  );
}
