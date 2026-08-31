interface CourseRequirementsProps {
  requirements: string[];
}

export function CourseRequirements({ requirements }: CourseRequirementsProps) {
  if (!requirements || requirements.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="requirements-heading" className="space-y-4">
      <h2 id="requirements-heading" className="text-2xl font-semibold text-slate-900">
        Requirements
      </h2>
      <ul className="space-y-3">
        {requirements.map((requirement, index) => (
          <li key={index} className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50/50 p-4">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span className="text-slate-700 leading-relaxed">{requirement}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
