import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-control bg-[linear-gradient(90deg,var(--color-line)_0%,#eaeeec_50%,var(--color-line)_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

/** Wraps skeleton regions so screen readers hear one "Loading" instead of silence. */
export function LoadingRegion({ label = "Loading", children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
