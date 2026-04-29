"use client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { Toaster } from "sonner";
import { TxStatusBar } from "@/components/ui/TxStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
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
