"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api/client";

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session (not per render, not shared across server requests).
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // serve cached lists instantly, revalidate after 30s
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: true,
            retry: (count, err) => (err instanceof ApiError ? err.retryable && count < 2 : count < 2),
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000), // exponential backoff
          },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="bottom-right" toastOptions={{ className: "font-sans" }} />
    </QueryClientProvider>
  );
}
