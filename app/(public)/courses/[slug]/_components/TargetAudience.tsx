interface TargetAudienceProps {
  audience: string[];
}

export function TargetAudience({ audience }: TargetAudienceProps) {
  if (!audience || audience.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="audience-heading" className="space-y-4">
      <h2 id="audience-heading" className="text-2xl font-semibold text-slate-900">
        Who Should Take This Course?
      </h2>
      <div className="flex flex-wrap gap-2">
        {audience.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-primary-600">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
