interface LearningExperienceProps {
  features: string[];
}

export function LearningExperience({ features }: LearningExperienceProps) {
  if (!features || features.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="experience-heading" className="space-y-4">
      <h2 id="experience-heading" className="text-2xl font-semibold text-slate-900">
        Learning Experience
      </h2>
      <p className="text-slate-600">
        Learning resources may include:
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-white p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 flex-shrink-0">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <span className="text-slate-700">{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
