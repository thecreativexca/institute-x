import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Separator character */
  separator?: React.ReactNode;
}

/**
 * Accessible breadcrumb navigation.
 */
export function Breadcrumb({ items, className, separator = (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)}: BreadcrumbProps) {
  const compactItems = items.length > 2 ? [items[1], items[items.length - 1]] : items;

  const renderItems = (visibleItems: BreadcrumbItem[]) =>
    visibleItems.map((item, index) => (
      <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-2">
        {index > 0 && (
          <span className="shrink-0 text-slate-400" aria-hidden="true">
            {separator}
          </span>
        )}
        {item.current || !item.href ? (
          <span
            aria-current={item.current ? "page" : undefined}
            className={cn(
              "truncate font-medium",
              item.current ? "text-slate-900" : "text-slate-600"
            )}
          >
            {item.label}
          </span>
        ) : (
          <Link
            href={item.href}
            className="truncate font-medium text-slate-600 transition-colors hover:text-primary-700"
          >
            {item.label}
          </Link>
        )}
      </li>
    ));

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0 text-sm", className)}>
      <ol className="flex min-w-0 items-center gap-2 sm:hidden">
        {renderItems(compactItems)}
      </ol>
      <ol className="hidden min-w-0 items-center gap-2 sm:flex">
        {renderItems(items)}
      </ol>
    </nav>
  );
}
