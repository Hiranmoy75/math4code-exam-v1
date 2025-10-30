"use client"

import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export function ReactQueryProviders({ children }: { children: React.ReactNode }) {
  // Create once
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 minutes - avoid refetch on every mount
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false, // change as needed
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Remove devtools on production */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
