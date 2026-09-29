import { TableSkeleton } from "@/components/cases/cases-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <Skeleton className="mb-6 h-9 w-40" />
      <div className="rounded-panel border border-line bg-surface">
        <div className="border-b border-line p-4"><Skeleton className="h-10 w-full max-w-xl" /></div>
        <TableSkeleton />
      </div>
    </>
  );
}
