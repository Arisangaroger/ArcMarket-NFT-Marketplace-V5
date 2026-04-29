"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Bell, Wallet, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { PLATFORM_NAME, shortenAddress } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";
import { NotificationsPanel } from "./NotificationsPanel";

const NAV_LINKS = [
  { href: "/", label: "Explore" },
  { href: "/profile", label: "My NFTs" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = useMarketStore((s) => s.unreadCount());

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 5V11L8 15L2 11V5L8 1Z" fill="white" fillOpacity="0.9" />
                <path d="M8 5L11 7V11L8 13L5 11V7L8 5Z" fill="white" />
              </svg>
            </div>
            <span className="font-display font-bold text-cream-900 text-lg tracking-tight">
              {PLATFORM_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-display font-medium transition-colors",
                  pathname === link.href
                    ? "bg-sky-50 text-sky-600"
                    : "text-cream-600 hover:text-cream-900 hover:bg-cream-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-cream-500 hover:text-cream-800 hover:bg-cream-100 transition-colors"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <NotificationsPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* Wallet */}
            {isConnected ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-cream-50 hover:bg-cream-100 border border-cream-200 text-cream-700 text-sm font-display font-medium px-3 py-2 rounded-xl transition-colors">
                  <div className="w-5 h-5 rounded-full bg-sky-400 flex items-center justify-center">
                    <Wallet size={11} className="text-white" />
                  </div>
                  {shortenAddress(address!)}
                  <ChevronDown size={13} className="text-cream-400" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-cream-200 rounded-xl shadow-lg py-1 hidden group-hover:block">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-cream-700 hover:bg-cream-50 font-sans">
                    My Profile
                  </Link>
                  <button
                    onClick={() => disconnect()}
                    className="block w-full text-left px-4 py-2 text-sm text-coral-600 hover:bg-cream-50 font-sans"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                disabled={isPending}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-display font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                <Wallet size={14} />
                {isPending ? "Connecting…" : "Connect"}
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-cream-600 hover:bg-cream-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-cream-100 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "px-4 py-2.5 rounded-xl text-sm font-display font-medium transition-colors",
                  pathname === link.href
                    ? "bg-sky-50 text-sky-600"
                    : "text-cream-600 hover:text-cream-900 hover:bg-cream-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
