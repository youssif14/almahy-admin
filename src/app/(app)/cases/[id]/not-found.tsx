import Link from "next/link";
import { EmptyState } from "@/components/ui/states";

export default function CaseNotFound() {
  return (
    <EmptyState
      title="This case doesn't exist"
      description="It may have been deleted, or the link has a typo."
      action={<Link href="/cases" className="text-sm font-medium text-brass underline underline-offset-4">Back to cases</Link>}
    />
  );
}
