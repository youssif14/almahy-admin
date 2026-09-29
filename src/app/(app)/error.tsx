"use client";
import { ErrorState } from "@/components/ui/states";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="This page failed to load"
      message={error.digest ? `Reference ${error.digest}. Try again, and if it keeps happening, share the reference with support.` : "Try again in a moment."}
      onRetry={reset}
    />
  );
}
