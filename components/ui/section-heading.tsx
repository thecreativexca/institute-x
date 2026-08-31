import { cn } from "@/lib/utils/cn";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  level?: 1 | 2 | 3;
  className?: string;
}

/** Consistent section title block used by public pages. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  level = 2,
  className,
}: SectionHeadingProps) {
  const Heading = (`h${level}` as const);
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
          {eyebrow}
        </span>
      ) : null}
      <Heading
        className={cn(
          "max-w-2xl text-balance font-semibold tracking-tight text-slate-900",
          level === 1 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p className={cn("max-w-2xl text-base leading-relaxed text-slate-600")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
