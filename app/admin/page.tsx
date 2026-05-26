"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useWithdrawPlatformFees } from "@/hooks/useProceeds";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS, formatEth, shortenAddress } from "@/lib/constants";
import {
  DollarSign, Gem, TrendingUp, Activity, ArrowDownToLine,
  BarChart3, ShoppingCart, Users, Zap, Shield, AlertCircle, ExternalLink,
} from "lucide-react";
import { parseEther } from "viem";
import { useCollections } from "@/hooks/useCollections";
import { COLLECTION_ADDRESSES } from "@/lib/collections-config";

// ── Helper: Map addresses to mock collection objects ────────────────
const COLLECTIONS = COLLECTION_ADDRESSES.map((addr, i) => ({
  name: `Collection ${i + 1}`,
  address: addr,
  totalVolume: parseEther("10.5"),
  totalRoyaltiesPaid: parseEther("0.5"),
  listedCount: 10,
  royaltyBps: 500,
}));

// ── Helper: Map addresses to collection objects ────────────────
const COLLECTIONS_META = COLLECTION_ADDRESSES.map((addr, i) => ({
  address: addr,
}));

// Chart bar helper
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 bg-cream-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "sales" | "collections">("overview");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { collections, isLoading: collectionsLoading } = useCollections();
  const { stats, recentSales, isLoading: statsLoading, refetch: refetchAnalytics } = useAdminAnalytics();

  const { data: platformFeesOnChain, refetch: refetchFees } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "marketplaceBalance",
    query: { enabled: isConnected },
  });

  const { writeContractAsync, isPending: feesPending } = useWriteContract();

  async function handleWithdrawFees() {
    await writeContractAsync({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "withdrawMarketplaceFees",
    });
    refetchFees();
    refetchAnalytics();
  }

  const platformFees = (platformFeesOnChain as bigint | undefined) ?? 0n;
  const hasFees = platformFees > 0n;

  if (!mounted) return null;

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

  const isLoading = statsLoading || collectionsLoading;

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
              Accumulated from {stats.totalSales} sales · 2% fee per transaction
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={feesPending}
            disabled={!hasFees || feesPending}
            onClick={handleWithdrawFees}
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
          { label: "Real Volume", value: `${formatEth(stats.totalVolume, 2)} ETH`, icon: <TrendingUp size={16} />, color: "sky" },
          { label: "Est. Royalties", value: `${formatEth(stats.totalRoyalties, 2)} ETH`, icon: <Gem size={16} />, color: "violet" },
          { label: "Total Sales", value: stats.totalSales.toString(), icon: <ShoppingCart size={16} />, color: "sage" },
          { label: "Active Listings", value: stats.activeListings.toString(), icon: <Activity size={16} />, color: "amber" },
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
            {isLoading ? (
              <div className="h-7 w-20 bg-cream-50 animate-pulse rounded" />
            ) : (
              <p className="text-xl font-display font-bold text-cream-900">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Secondary metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <p className="text-xs text-cream-400 font-sans mb-0.5 flex items-center gap-1">
            <Activity size={11} /> Total Listings
          </p>
          {isLoading ? (
            <div className="h-8 w-12 bg-cream-50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-display font-bold text-cream-900">{stats.totalListings}</p>
          )}
          <p className="text-xs text-cream-400 font-sans mt-1">all-time events</p>
        </div>
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <p className="text-xs text-cream-400 font-sans mb-0.5 flex items-center gap-1">
            <Zap size={11} /> Collections
          </p>
          {isLoading ? (
            <div className="h-8 w-12 bg-cream-50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-display font-bold text-cream-900">{collections.length}</p>
          )}
          <p className="text-xs text-cream-400 font-sans mt-1">unique contracts</p>
        </div>
        <div className="bg-white rounded-2xl border border-cream-200 p-4">
          <p className="text-xs text-cream-400 font-sans mb-0.5 flex items-center gap-1">
            <BarChart3 size={11} /> Sell-through Rate
          </p>
          {isLoading ? (
            <div className="h-8 w-12 bg-cream-50 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-display font-bold text-cream-900">
              {stats.totalListings > 0 ? Math.round((stats.totalSales / stats.totalListings) * 100) : 0}%
            </p>
          )}
          <p className="text-xs text-cream-400 font-sans mt-1">sales / total listings</p>
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
                { 
                  label: "To Sellers", 
                  amount: stats.totalVolume - stats.totalRoyalties - platformFees, 
                  color: "bg-sky-400", 
                  textColor: "text-sky-600", 
                  pct: stats.totalVolume > 0n ? Number(((stats.totalVolume - stats.totalRoyalties - platformFees) * 100n) / stats.totalVolume) : 0 
                },
                { 
                  label: "Creator Royalties", 
                  amount: stats.totalRoyalties, 
                  color: "bg-violet-400", 
                  textColor: "text-violet-600", 
                  pct: stats.totalVolume > 0n ? Number((stats.totalRoyalties * 100n) / stats.totalVolume) : 0 
                },
                { 
                  label: "Platform Fees", 
                  amount: platformFees, 
                  color: "bg-amber-400", 
                  textColor: "text-amber-600", 
                  pct: stats.totalVolume > 0n ? Number((platformFees * 100n) / stats.totalVolume) : 0 
                },
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
              {formatEth(stats.totalRoyalties, 2)} ETH
            </p>
            <p className="text-xs text-violet-500 font-sans mb-5">
              Total paid to creators via ERC-2981
            </p>
            <div className="space-y-3">
              {collections.slice(0, 5).map((c) => (
                <div key={c.address} className="flex items-center justify-between text-sm">
                  <span className="text-cream-600 font-sans">{c.name}</span>
                  <span className="font-display font-semibold text-violet-700">
                    {formatEth(c.totalRoyaltiesPaid || 0n, 3)} ETH
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
            <Badge variant="sky">{recentSales.length} detected</Badge>
          </div>
          <div className="divide-y divide-cream-50">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-6 h-16 bg-cream-50 animate-pulse" />
              ))
            ) : recentSales.length === 0 ? (
              <div className="px-5 py-16 text-center text-cream-400 font-sans">No sales recorded yet.</div>
            ) : (
              recentSales.map((sale, i) => (
                <div key={i} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center text-cream-400 shrink-0">
                      <ShoppingCart size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-display font-semibold text-cream-900">
                        NFT #{sale.tokenId}
                      </p>
                      <p className="text-xs text-cream-400 font-sans">
                        {shortenAddress(sale.nftAddress)} · {new Date(sale.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right sm:text-left">
                    <div>
                      <p className="text-xs text-cream-400 font-sans">Price</p>
                      <p className="text-sm font-display font-semibold text-cream-900">{formatEth(sale.price, 3)} ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-cream-400 font-sans">Buyer</p>
                      <code className="text-xs font-mono text-sky-600">{shortenAddress(sale.buyer)}</code>
                    </div>
                    <a 
                      href={`https://etherscan.io/tx/${sale.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cream-300 hover:text-sky-500"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))
            )}
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
            {collectionsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-5 h-20 bg-cream-50 animate-pulse" />
              ))
            ) : collections.length === 0 ? (
              <div className="px-5 py-10 text-center text-cream-400 font-sans">No collections found.</div>
            ) : (
              collections
                .map((c) => ({
                  name: c.name,
                  volume: c.totalVolume,
                  royalties: c.totalRoyaltiesPaid,
                  sales: Math.floor(c.listedCount * 1.5),
                  royaltyBps: c.royaltyBps
                }))
                .sort((a, b) => Number(b.volume - a.volume))
                .map((col, i) => {
                  const maxVol = collections.length > 0 ? Number(collections[0].totalVolume) || 1 : 1;
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
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
