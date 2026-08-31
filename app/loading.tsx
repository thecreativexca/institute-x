import { LoadingState } from "@/components/ui/loading";

/** Route-level loading UI shown while server components stream. */
export default function Loading() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center">
      <LoadingState />
    </main>
  );
}
