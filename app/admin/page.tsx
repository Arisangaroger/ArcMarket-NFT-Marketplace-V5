"use client";
import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useWithdrawPlatformFees } from "@/hooks/useProceeds";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS, formatEth } from "@/lib/constants";
import {
  DollarSign, Gem, TrendingUp, Activity, ArrowDownToLine,
  BarChart3, ShoppingCart, Users, Zap, Shield, AlertCircle,
} from "lucide-react";
import { parseEther } from "viem";

// ── Mock analytics data ───────────────────────────────────────────
const MOCK_STATS = {
  totalVolume: parseEther("312.8"),
  totalRoyaltiesPaid: parseEther("14.2"),
  totalPlatformFees: parseEther("6.26"),
  totalListings: 148,
  totalSales: 94,
  activeListings: 61,
  uniqueCollections: 8,
  uniqueTraders: 43,
};

const MOCK_RECENT_SALES = [
  { name: "Quantum Ape #1", collection: "Quantum Apes", price: parseEther("1.5"), royalty: parseEther("0.075"), fee: parseEther("0.03"), buyer: "0xBuyer1abc", time: "2m ago" },
  { name: "Pixel Punk #99", collection: "Pixel Punks", price: parseEther("0.35"), royalty: parseEther("0.00875"), fee: parseEther("0.007"), buyer: "0xBuyer2abc", time: "14m ago" },
  { name: "Neon Cat #42", collection: "Neon Cats", price: parseEther("2.3"), royalty: 0n, fee: parseEther("0.046"), buyer: "0xBuyer3abc", time: "1h ago" },
  { name: "Quantum Ape #7", collection: "Quantum Apes", price: parseEther("0.8"), royalty: parseEther("0.04"), fee: parseEther("0.016"), buyer: "0xBuyer4abc", time: "3h ago" },
  { name: "Pixel Punk #200", collection: "Pixel Punks", price: parseEther("0.6"), royalty: parseEther("0.015"), fee: parseEther("0.012"), buyer: "0xBuyer5abc", time: "5h ago" },
];

const MOCK_TOP_COLLECTIONS = [
  { name: "Quantum Apes", volume: parseEther("48.2"), royalties: parseEther("2.41"), sales: 32, royaltyBps: 500 },
  { name: "Pixel Punks", volume: parseEther("31.5"), royalties: parseEther("0.79"), sales: 28, royaltyBps: 250 },
  { name: "Neon Cats", volume: parseEther("19.8"), royalties: 0n, sales: 16, royaltyBps: 0 },
];

// Chart bar helper
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 bg-cream-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [activeSection, setActiveSection] = useState<"overview" | "sales" | "collections">("overview");

  const { withdraw: withdrawFees, isPending: feesPending } = useWithdrawPlatformFees();

  // Real contract read for platform fees
  const { data: platformFeesOnChain } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getPlatformFees",
    query: { enabled: isConnected },
  });

  const platformFees = (platformFeesOnChain as bigint | undefined) ?? MOCK_STATS.totalPlatformFees;
  const hasFees = platformFees > 0n;

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-900 mb-2">Admin Panel</h2>
        <p className="text-cream-500 font-sans">Connect your wallet to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-display font-bold text-cream-900">Admin Dashboard</h1>
            <Badge variant="amber" size="md">Owner Only</Badge>
          </div>
          <p className="text-sm text-cream-400 font-sans">
            Platform revenue, analytics, and business intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700 font-sans">
          <AlertCircle size={13} />
          Only the contract owner can withdraw fees.
        </div>
      </div>

      {/* ── Platform Revenue Card (Hero) ── */}
      <div className="bg-gradient-to-br from-amber-50 to-sky-50 border border-amber-100 rounded-2xl p-6 mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-display font-semibold text-amber-500 uppercase tracking-wider mb-1">
              Platform Revenue
            </p>
            <p className="text-4xl font-display font-bold text-cream-900">
              {formatEth(platformFees, 4)}
              <span className="text-xl font-normal text-cream-400 ml-2">ETH</span>
            </p>
            <p className="text-sm text-cream-500 font-sans mt-1">
              Accumulated from {MOCK_STATS.totalSales} sales · 2% fee per transaction
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={feesPending}
            disabled={!hasFees || feesPending}
            onClick={withdrawFees}
            className="bg-amber-500 hover:bg-amber-600 shrink-0"
          >
            <ArrowDownToLine size={16} />
            {hasFees ? "Withdraw Platform Fees" : "No fees to withdraw"}
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Total Volume", value: `${formatEth(MOCK_STATS.totalVolume, 1)} ETH`, icon: <TrendingUp size={16} />, color: "sky" },
          { label: "Royalties Paid", value: `${formatEth(MOCK_STATS.totalRoyaltiesPaid, 2)} ETH`, icon: <Gem size={16} />, color: "violet" },
          { label: "Total Sales", value: MOCK_STATS.totalSales.toString(), icon: <ShoppingCart size={16} />, color: "sage" },
          { label: "Unique Traders", value: MOCK_STATS.uniqueTraders.toString(), icon: <Users size={16} />, color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-cream-200 p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${
              stat.color === "sky" ? "bg-sky-100 text-sky-600" :
              stat.color === "violet" ? "bg-violet-100 text-violet-600" :
              stat.color === "sage" ? "bg-sage-100 text-sage-600" :
              "bg-amber-100 text-amber-600"
            }`}>
              {stat.icon}
            </div>
            <p className="text-xs text-cream-400 font-sans mb-0.5">{stat.label}</p>
            <p className="text-xl font-display font-bold text-cream-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Secondary metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <p className="text-xs text-cream-400 font-sans mb-0.5 flex items-center gap-1">
            <Activity size={11} /> Active Listings
          </p>
          <p className="text-2xl font-display font-bold text-cream-900">{MOCK_STATS.activeListings}</p>
          <p className="text-xs text-cream-400 font-sans mt-1">of {MOCK_STATS.totalListings} total</p>
        </div>
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <p className="text-xs text-cream-400 font-sans mb-0.5 flex items-center gap-1">
            <Zap size={11} /> Collections
          </p>
          <p className="text-2xl font-display font-bold text-cream-900">{MOCK_STATS.uniqueCollections}</p>
          <p className="text-xs text-cream-400 font-sans mt-1">unique contracts</p>
        </div>
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <p className="text-xs text-cream-400 font-sans mb-0.5 flex items-center gap-1">
            <BarChart3 size={11} /> Sell-through Rate
          </p>
          <p className="text-2xl font-display font-bold text-cream-900">
            {Math.round((MOCK_STATS.totalSales / MOCK_STATS.totalListings) * 100)}%
          </p>
          <p className="text-xs text-cream-400 font-sans mt-1">sales / listings</p>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex gap-1 bg-white border border-cream-200 rounded-xl p-1 mb-6 w-fit">
        {([
          { key: "overview", label: "Overview" },
          { key: "sales", label: "Recent Sales" },
          { key: "collections", label: "Collections" },
        ] as { key: typeof activeSection; label: string }[]).map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 rounded-lg text-sm font-display font-medium transition-all ${
              activeSection === s.key
                ? "bg-sky-500 text-white shadow-sm"
                : "text-cream-500 hover:text-cream-800 hover:bg-cream-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Overview: fee breakdown chart ── */}
      {activeSection === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue split */}
          <div className="bg-white rounded-2xl border border-cream-200 p-6">
            <h3 className="text-sm font-display font-semibold text-cream-700 mb-4">Revenue Composition</h3>
            <div className="space-y-4">
              {[
                { label: "To Sellers", amount: parseEther("285.3"), color: "bg-sky-400", textColor: "text-sky-600", pct: 91 },
                { label: "Creator Royalties", amount: MOCK_STATS.totalRoyaltiesPaid, color: "bg-violet-400", textColor: "text-violet-600", pct: 4.5 },
                { label: "Platform Fees", amount: MOCK_STATS.totalPlatformFees, color: "bg-amber-400", textColor: "text-amber-600", pct: 2 },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <p className="text-xs text-cream-500 font-sans">{row.label}</p>
                    <p className={`text-sm font-display font-semibold ${row.textColor}`}>
                      {formatEth(row.amount, 2)} ETH
                    </p>
                  </div>
                  <Bar value={row.pct} max={100} color={row.color} />
                  <span className="text-xs text-cream-400 font-sans w-10 text-right">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Royalties insight */}
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gem size={16} className="text-violet-500" />
              <h3 className="text-sm font-display font-semibold text-violet-700">Royalty Economy</h3>
            </div>
            <p className="text-3xl font-display font-bold text-violet-800 mb-1">
              {formatEth(MOCK_STATS.totalRoyaltiesPaid, 2)} ETH
            </p>
            <p className="text-xs text-violet-500 font-sans mb-5">
              Total paid to creators via ERC-2981
            </p>
            <div className="space-y-3">
              {MOCK_TOP_COLLECTIONS.filter((c) => c.royaltyBps > 0).map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="text-cream-600 font-sans">{c.name}</span>
                  <span className="font-display font-semibold text-violet-700">
                    {formatEth(c.royalties, 3)} ETH
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Sales ── */}
      {activeSection === "sales" && (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-cream-100 flex items-center justify-between">
            <h3 className="text-sm font-display font-semibold text-cream-700">Recent Sales</h3>
            <Badge variant="sky">{MOCK_RECENT_SALES.length} shown</Badge>
          </div>
          <div className="divide-y divide-cream-50">
            {MOCK_RECENT_SALES.map((sale, i) => (
              <div key={i} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center text-cream-400 shrink-0">
                    <ShoppingCart size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-cream-900">{sale.name}</p>
                    <p className="text-xs text-cream-400 font-sans">{sale.collection} · {sale.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right sm:text-left">
                  <div>
                    <p className="text-xs text-cream-400 font-sans">Sale</p>
                    <p className="text-sm font-display font-semibold text-cream-900">{formatEth(sale.price, 3)} ETH</p>
                  </div>
                  {sale.royalty > 0n ? (
                    <div>
                      <p className="text-xs text-violet-400 font-sans">Royalty</p>
                      <p className="text-sm font-display font-semibold text-violet-600">{formatEth(sale.royalty, 4)} ETH</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-cream-300 font-sans">Royalty</p>
                      <p className="text-sm text-cream-300 font-sans">—</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-amber-400 font-sans">Fee</p>
                    <p className="text-sm font-display font-semibold text-amber-600">{formatEth(sale.fee, 4)} ETH</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Collections Analytics ── */}
      {activeSection === "collections" && (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-cream-100">
            <h3 className="text-sm font-display font-semibold text-cream-700">Collection Performance</h3>
          </div>
          <div className="divide-y divide-cream-50">
            {MOCK_TOP_COLLECTIONS.map((col, i) => {
              const maxVol = Number(MOCK_TOP_COLLECTIONS[0].volume);
              return (
                <div key={col.name} className="px-5 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-display font-bold text-cream-300">#{i + 1}</span>
                      <span className="text-sm font-display font-semibold text-cream-900">{col.name}</span>
                      {col.royaltyBps > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full font-sans">
                          <Gem size={9} /> {col.royaltyBps / 100}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-xs text-cream-400 font-sans">Volume</p>
                        <p className="text-sm font-display font-semibold text-cream-900">{formatEth(col.volume, 1)} ETH</p>
                      </div>
                      <div>
                        <p className="text-xs text-cream-400 font-sans">Sales</p>
                        <p className="text-sm font-display font-semibold text-cream-900">{col.sales}</p>
                      </div>
                      {col.royaltyBps > 0 && (
                        <div>
                          <p className="text-xs text-violet-400 font-sans">Royalties</p>
                          <p className="text-sm font-display font-semibold text-violet-600">{formatEth(col.royalties, 3)} ETH</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full transition-all duration-500"
                      style={{ width: `${(Number(col.volume) / maxVol) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
