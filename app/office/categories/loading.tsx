import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading categories">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-24 rounded-xl" />
      {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
    </div>
  );
}
