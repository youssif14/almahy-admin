import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingRegion label="Loading case" className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-4 w-48" />
        <Skeleton className="mt-2 h-9 w-2/3" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 rounded-panel" />
          <div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-48 rounded-panel" /><Skeleton className="h-48 rounded-panel" /></div>
        </div>
        <Skeleton className="h-96 rounded-panel" />
      </div>
    </LoadingRegion>
  );
}
