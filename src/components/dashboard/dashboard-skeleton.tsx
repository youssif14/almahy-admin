import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <LoadingRegion label="Loading dashboard" className="flex flex-col gap-6">
      <Skeleton className="h-[8.5rem] w-full rounded-panel" />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-96 rounded-panel" />
        <Skeleton className="h-96 rounded-panel" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-64 rounded-panel" />
        ))}
      </div>
    </LoadingRegion>
  );
}
