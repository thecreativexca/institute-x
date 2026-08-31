interface LearningOutcomesProps {
  outcomes: string[];
}

export function LearningOutcomes({ outcomes }: LearningOutcomesProps) {
  if (!outcomes || outcomes.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="outcomes-heading" className="space-y-4">
      <h2 id="outcomes-heading" className="text-2xl font-semibold text-slate-900">
        What You&rsquo;ll Learn
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {outcomes.map((outcome, index) => (
          <li key={index} className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-white p-4 shadow-card transition-colors hover:border-primary-200">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 font-semibold text-primary-800">
              {index + 1}
            </div>
            <span className="text-slate-700 leading-relaxed">{outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
