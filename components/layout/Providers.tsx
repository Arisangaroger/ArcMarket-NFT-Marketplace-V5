"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { Toaster } from "sonner";
import { TxStatusBar } from "@/components/ui/TxStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time: 1 minute for most queries
      staleTime: 60_000, // 1 minute
      // Cache time: Keep data in cache for 5 minutes after it becomes unused
      gcTime: 5 * 60_000, // 5 minutes (formerly cacheTime)
      // Don't refetch on window focus (reduces unnecessary RPC calls)
      refetchOnWindowFocus: false,
      // Retry failed queries once
      retry: 1,
      // Refetch on mount only if data is stale
      refetchOnMount: true,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <TxStatusBar />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #EDE6D8",
              borderRadius: "12px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
              color: "#2C2319",
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
