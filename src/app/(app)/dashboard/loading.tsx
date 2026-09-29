import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function Loading() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-80" />
      </div>
      <DashboardSkeleton />
    </>
  );
}
