"use client";
import { useState, useCallback } from "react";
import { Zap, Gem, TrendingUp, Flame, Search } from "lucide-react";
import { NFTCard } from "@/components/nft/NFTCard";
import { CollectionCard } from "@/components/nft/CollectionCard";
import { Modal } from "@/components/ui/Modal";
import { PriceBreakdown } from "@/components/nft/PriceBreakdown";
import { Button } from "@/components/ui/Button";
import { NFTCardSkeleton } from "@/components/ui/Skeleton";
import { useBuyItem } from "@/hooks/useListings";
import { useMarketplaceEvents } from "@/hooks/useEvents";
import { PLATFORM_FEE_BPS, formatEth } from "@/lib/constants";
import { parseEther } from "viem";
import { useCollections } from "@/hooks/useCollections";
import { useMarketplaceState } from "@/hooks/useMarketplaceState";
import { NFTListing } from "@/lib/types";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "royalty" | "no-royalty">("all");
  const [buyModal, setBuyModal] = useState<NFTListing | null>(null);
  const { collections, isLoading: collectionsLoading, refetch: refetchCollections } = useCollections();
  const { listings: allListings, isLoading: listingsLoading, refetch: refetchMarketplace } = useMarketplaceState();

  const handleRefresh = useCallback(() => {
    refetchCollections();
    refetchMarketplace();
  }, [refetchCollections, refetchMarketplace]);

  const { buyItem, isPending } = useBuyItem(handleRefresh);

  // Listen to real events
  useMarketplaceEvents();

  const filtered = allListings.filter((l) => {
    const matchSearch =
      !search ||
      l.metadata?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.collectionName?.toLowerCase().includes(search.toLowerCase()) ||
      l.tokenId.includes(search);
    const matchFilter =
      filter === "all" ||
      (filter === "royalty" && l.hasRoyalty) ||
      (filter === "no-royalty" && !l.hasRoyalty);
    return matchSearch && matchFilter;
  });


  const topRoyaltyCollections = collections.filter((c) => c.hasRoyalty)
    .sort((a, b) => Number(b.totalRoyaltiesPaid - a.totalRoyaltiesPaid));

  async function handleBuy() {
    if (!buyModal) return;
    await buyItem(
      buyModal.nftAddress as `0x${string}`,
      buyModal.tokenId,
      buyModal.price
    );
    setBuyModal(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Hero ── */}
      <section className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-600 text-xs font-display font-semibold px-3 py-1.5 rounded-full mb-4">
          <Zap size={12} />
          V5 · ERC-2981 Royalties · Full Transparency
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-cream-900 leading-tight mb-4 text-balance">
          The NFT Marketplace That Shows
          <br />
          <span className="text-sky-500">Where Every ETH Goes</span>
        </h1>
        <p className="text-base text-cream-500 font-sans max-w-lg mx-auto">
          Full price breakdowns. Creator royalties. Platform fees. Nothing hidden.
          Trade with complete confidence.
        </p>
      </section>

      {/* ── Top Royalty Collections ── */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <Gem size={18} className="text-violet-500" />
          <h2 className="text-lg font-display font-bold text-cream-900">Top Royalty Collections</h2>
          <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-sans ml-1">
            Creator-first
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collectionsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-cream-50 animate-pulse rounded-2xl border border-cream-100" />
            ))
          ) : (
            topRoyaltyCollections.map((c, i) => (
              <CollectionCard key={c.address} collection={c} rank={i + 1} />
            ))
          )}
        </div>
      </section>

      {/* ── All Collections ── */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-sky-500" />
          <h2 className="text-lg font-display font-bold text-cream-900">All Collections</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collectionsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-cream-50 animate-pulse rounded-2xl border border-cream-100" />
            ))
          ) : (
            collections.map((c) => (
              <CollectionCard key={c.address} collection={c} />
            ))
          )}
        </div>
      </section>

      {/* ── Browse NFTs ── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-coral-500" />
            <h2 className="text-lg font-display font-bold text-cream-900">Live Listings</h2>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search NFTs…"
                className="pl-9 pr-4 py-2 text-sm bg-white border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 font-sans text-cream-800 placeholder:text-cream-300 w-48"
              />
            </div>
            <div className="flex bg-white border border-cream-200 rounded-xl overflow-hidden">
              {(["all", "royalty", "no-royalty"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-2 font-sans transition-colors capitalize ${
                    filter === f
                      ? "bg-sky-500 text-white"
                      : "text-cream-500 hover:bg-cream-50"
                  }`}
                >
                  {f === "royalty" ? "Has Royalty" : f === "no-royalty" ? "No Royalty" : "All"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {listingsLoading ? (
            Array(8).fill(0).map((_, i) => <NFTCardSkeleton key={i} />)
          ) : filtered.length > 0 ? (
            filtered.map((listing) => (
              <NFTCard
                key={`${listing.nftAddress}-${listing.tokenId}`}
                listing={listing}
                onQuickBuy={(l) => setBuyModal(l)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-cream-400 font-sans">No listings found.</p>
            </div>
          )}
        </div>

      </section>

      {/* ── Buy Confirmation Modal ── */}
      <Modal
        open={!!buyModal}
        onClose={() => setBuyModal(null)}
        title="Confirm Purchase"
        size="md"
      >
        {buyModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl border border-cream-100">
              <div className="w-14 h-14 rounded-xl bg-cream-200 overflow-hidden shrink-0">
                {/* NFT image preview */}
                <div className="w-full h-full flex items-center justify-center text-cream-400 text-xs font-mono">
                  #{buyModal.tokenId}
                </div>
              </div>
              <div>
                <p className="font-display font-semibold text-cream-900 text-sm">
                  {buyModal.metadata?.name || `NFT #${buyModal.tokenId}`}
                </p>
                <p className="text-xs text-cream-400 font-sans">{buyModal.collectionName}</p>
              </div>
            </div>

            <PriceBreakdown
              priceWei={buyModal.price}
              royaltyBps={buyModal.royaltyBps || 0}
            />

            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="text-amber-500 text-xs font-sans">
                You will be charged exactly{" "}
                <strong className="font-display">{formatEth(buyModal.price)} ETH</strong>.
                This is your total cost.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setBuyModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth loading={isPending} onClick={handleBuy}>
                Confirm Purchase · {formatEth(buyModal.price)} ETH
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
