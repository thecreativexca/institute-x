/**
 * Hero visual — professional education dashboard mockup.
 * Pure CSS/JSX visual showing a learning portal interface.
 * No external images required; degrades gracefully.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-5xl rounded-[1.75rem] bg-accent-200/80 p-2 shadow-[0_28px_70px_-38px_rgb(22_71_47/0.55)] sm:p-3">
      <div className="overflow-hidden rounded-[1.25rem] border border-primary-100 bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-2.5 border-b border-primary-100 bg-primary-50/80 px-4 py-3">
        <div className="flex h-3 w-3 rounded-full bg-red-400" />
        <div className="flex h-3 w-3 rounded-full bg-yellow-400" />
        <div className="flex h-3 w-3 rounded-full bg-green-400" />
        <div className="ml-1 flex-1 rounded-full border border-primary-100 bg-white/80 px-3 py-1.5 text-center text-[10px] font-mono text-slate-500 sm:text-xs">
          student learning dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-5 sm:p-7">
        {/* Welcome header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-primary-700">Welcome back, Priya</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Continue your learning journey
          </h2>
        </div>

        {/* Progress overview cards */}
        <div className="mb-6 grid grid-cols-3 gap-2.5 sm:gap-4">
          {[
            { label: "Courses Enrolled", value: "4", icon: "book" },
            { label: "Lessons Completed", value: "27", icon: "check" },
            { label: "Overall Progress", value: "68%", icon: "chart" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-primary-100 bg-primary-50/65 p-3 transition-shadow hover:shadow-card sm:p-4"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary-900 sm:text-3xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Continue learning section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Continue Learning
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                course: "MERN Stack Development",
                lesson: "Module 3: Building REST APIs with Express",
                progress: 45,
                color: "primary",
              },
              {
                course: "Digital Marketing",
                lesson: "Module 2: SEO Fundamentals",
                progress: 78,
                color: "accent",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-primary-100 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <p className="text-xs font-medium text-slate-500">{item.course}</p>
                <p className="mt-1 text-sm font-medium text-slate-900 line-clamp-1">
                  {item.lesson}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.progress}%`,
                      backgroundColor:
                        item.color === "primary"
                          ? "var(--color-primary-600)"
                          : "var(--color-accent-500)",
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {item.progress}% complete
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming assessments */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Upcoming Assessments
          </h3>
          <div className="rounded-xl border border-accent-200 bg-accent-50/80 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  Quiz: JavaScript Fundamentals
                </p>
                <p className="text-sm text-slate-600">
                  Web Development • Due in 3 days
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-accent-200 px-3 py-1 text-xs font-medium text-accent-900">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
