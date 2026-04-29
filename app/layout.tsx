import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { PLATFORM_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${PLATFORM_NAME} — Transparent NFT Marketplace`,
  description: "Buy, sell, and create NFTs with full transparency. See exactly where every ETH goes.",
  openGraph: {
    title: `${PLATFORM_NAME}`,
    description: "The most transparent NFT marketplace. Full ERC-2981 royalty support.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          <footer className="border-t border-cream-200 bg-white mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-cream-400 font-sans">
                © {new Date().getFullYear()} {PLATFORM_NAME}. Full transparency NFT marketplace.
              </p>
              <p className="text-xs text-cream-300 font-sans">
                ERC-721 · ERC-2981 · Powered by Ethereum
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
