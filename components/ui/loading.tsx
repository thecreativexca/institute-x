import { cn } from "@/lib/utils/cn";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

/** Full-area loading placeholder used while server data streams in. */
export function LoadingState({
  message = "Loading, please wait…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-slate-600",
        className
      )}
    >
      <Spinner />
      <p className="text-sm">{message}</p>
    </div>
  );
}
