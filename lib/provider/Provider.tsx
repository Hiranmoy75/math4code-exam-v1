"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import toast from "react-hot-toast";

// Global error handler for queries
function handleQueryError(error: unknown) {
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  console.error("Query Error:", error);
  toast.error(message);
}

// Global error handler for mutations
function handleMutationError(error: unknown) {
  const message = error instanceof Error ? error.message : "Operation failed";
  console.error("Mutation Error:", error);
  toast.error(message);
}

export function ReactQueryProviders({ children }: { children: React.ReactNode }) {
  // Create QueryClient once with production-ready configuration
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
            gcTime: 1000 * 60 * 10, // 10 minutes - garbage collection
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error instanceof Error && "status" in error) {
                const status = (error as any).status;
                if (status >= 400 && status < 500) return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            retry: 1,
            onError: handleMutationError,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* DevTools only in development */}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

