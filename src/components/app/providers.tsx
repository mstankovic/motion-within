"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ServiceWorkerRegistrar } from "./service-worker-registrar";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, networkMode: "offlineFirst" },
          mutations: { networkMode: "offlineFirst" },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ServiceWorkerRegistrar />
    </QueryClientProvider>
  );
}
