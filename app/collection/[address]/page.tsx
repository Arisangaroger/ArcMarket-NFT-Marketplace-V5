"use client";
import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { NFTCard } from "@/components/nft/NFTCard";
import { RoyaltyBadge } from "@/components/nft/RoyaltyBadge";
import { Modal } from "@/components/ui/Modal";
import { PriceBreakdown } from "@/components/nft/PriceBreakdown";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { useBuyItem } from "@/hooks/useListings";
import { formatEth, shortenAddress, resolveIPFS, PLATFORM_NAME } from "@/lib/constants";
import { parseEther } from "viem";
import { useCollection, useUserCollectionNFTs } from "@/hooks/useCollections";
import { useMarketplaceState } from "@/hooks/useMarketplaceState";
import { useMint } from "@/hooks/useMint";
import { NFTListing } from "@/lib/types";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, TrendingUp, Tag, Users, Gem, Copy, ExternalLink, Zap, Image as ImageIcon, Wallet } from "lucide-react";
import { clsx } from "clsx";

// ── Data is now looked up dynamically from @/lib/collections-config ───────────

export default function CollectionPage() {
  const params = useParams();
  const address = params.address as string;
  const [buyModal, setBuyModal] = useState<NFTListing | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState<"unlisted" | "listed">("unlisted");
  const { refetch: refetchCollection, collection, isLoading: collectionLoading } = useCollection(address);
  const { refetch: refetchMarketplace, listings: allListings, isLoading: listingsLoading } = useMarketplaceState();
  const { ownedNFTs, isLoading: ownedLoading, refetch: refetchOwned } = useUserCollectionNFTs(address);

  const handleMintSuccess = useCallback(() => {
    refetchCollection();
    refetchOwned();
  }, [refetchCollection, refetchOwned]);

  const handleBuySuccess = useCallback(() => {
    refetchCollection();
    refetchMarketplace();
    refetchOwned();
  }, [refetchCollection, refetchMarketplace, refetchOwned]);

  const { buyItem, isPending: buyPending } = useBuyItem(handleBuySuccess);
  const { mint, isPending: mintPending } = useMint(handleMintSuccess);

  const listings = allListings.filter(
    (l) => l.nftAddress.toLowerCase() === address.toLowerCase()
  );

  if (collectionLoading || listingsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin mx-auto mb-4" />
        <p className="text-cream-500 font-sans font-medium">Fetching collection metadata from blockchain…</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle size={28} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-900 mb-2">Collection Not Found</h2>
        <p className="text-cream-500 font-sans mb-8">The collection address <code className="bg-cream-100 px-1.5 py-0.5 rounded text-cream-700">{address}</code> is not in our registry.</p>
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft size={16} /> Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  function copyAddress() {
    navigator.clipboard.writeText(collection.creatorAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleBuy() {
    if (!buyModal) return;
    await buyItem(buyModal.nftAddress as `0x${string}`, buyModal.tokenId, buyModal.price);
    setBuyModal(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2">

      {/* ── Collection Header ── */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden mb-8">
        {/* Banner */}
        <div className="relative h-40 bg-cream-50 overflow-hidden">
          {collection.imageUri ? (
            <Image
              src={resolveIPFS(collection.imageUri)}
              alt={collection.name}
              fill
              className="object-cover blur-3xl opacity-20 scale-110"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-sky-50 via-violet-50 to-sky-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + name row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 mb-6 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center shrink-0">
              {collection.imageUri ? (
                <Image
                  src={resolveIPFS(collection.imageUri)}
                  alt={collection.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-display font-bold text-sky-500">
                  {collection.symbol.slice(0, 2)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-cream-900">{collection.name}</h1>
                <span className="text-sm font-mono text-cream-400 bg-cream-50 px-2 py-0.5 rounded-lg border border-cream-100">
                  {collection.symbol}
                </span>
                <RoyaltyBadge
                  hasRoyalty={collection.hasRoyalty}
                  royaltyPercent={collection.royaltyBps / 100}
                  size="md"
                />
              </div>
              <p className="text-sm text-cream-500 font-sans mt-2 max-w-2xl leading-relaxed">
                {collection.description || `Official ${collection.name} collection on ${PLATFORM_NAME}.`}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-cream-50 rounded-xl p-3">
              <p className="text-xs text-cream-400 font-sans mb-1 flex items-center gap-1">
                <TrendingUp size={11} /> Total Volume
              </p>
              <p className="text-lg font-display font-bold text-cream-900">
                {formatEth(collection.totalVolume, 2)} ETH
              </p>
            </div>
            <div className="bg-cream-50 rounded-xl p-3">
              <p className="text-xs text-cream-400 font-sans mb-1 flex items-center gap-1">
                <Tag size={11} /> Floor Price
              </p>
              <p className="text-lg font-display font-bold text-cream-900">
                {formatEth(collection.floorPrice, 3)} ETH
              </p>
            </div>
            <div className="bg-cream-50 rounded-xl p-3">
              <p className="text-xs text-cream-400 font-sans mb-1 flex items-center gap-1">
                <Users size={11} /> Listed
              </p>
              <p className="text-lg font-display font-bold text-cream-900">
                {collection.listedCount}
              </p>
            </div>
            {collection.hasRoyalty ? (
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                <p className="text-xs text-violet-400 font-sans mb-1 flex items-center gap-1">
                  <Gem size={11} /> Royalties Paid
                </p>
                <p className="text-lg font-display font-bold text-violet-700">
                  {formatEth(collection.totalRoyaltiesPaid, 2)} ETH
                </p>
              </div>
            ) : (
              <div className="bg-cream-50 rounded-xl p-3">
                <p className="text-xs text-cream-400 font-sans mb-1">Royalties</p>
                <p className="text-sm font-sans text-cream-400">None</p>
              </div>
            )}
          </div>

          {/* Creator section */}
          <div className="bg-cream-50 border border-cream-100 rounded-xl p-4">
            <p className="text-xs font-display font-semibold text-cream-500 uppercase tracking-wider mb-2">
              Creator
            </p>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                  <span className="text-xs font-display font-bold text-sky-600">
                    {collection.creatorAddress.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <code className="text-sm font-mono text-cream-700">
                  {shortenAddress(collection.creatorAddress)}
                </code>
              </div>
              <div className="flex items-center gap-2">
                {collection.hasRoyalty && (
                  <span className="text-xs text-violet-600 bg-violet-50 border border-violet-100 px-2 py-1 rounded-lg font-sans">
                    Earns {collection.royaltyBps / 100}% on each resale
                  </span>
                )}
                <button
                  onClick={copyAddress}
                  className="p-1.5 rounded-lg hover:bg-cream-200 text-cream-400 hover:text-cream-700 transition-colors"
                  title="Copy address"
                >
                  <Copy size={14} />
                </button>
                <a
                  href={`https://etherscan.io/address/${collection.creatorAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-cream-200 text-cream-400 hover:text-cream-700 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            {copied && (
              <p className="text-xs text-sage-600 font-sans mt-1">Copied!</p>
            )}
          </div>

          {/* ── Minting Section ── */}
          {collection.mintPrice !== undefined && (
            <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-display font-bold flex items-center gap-2">
                    <Zap size={18} className="fill-current" />
                    Mint Your NFT
                  </h3>
                  <p className="text-sky-100 text-sm font-sans mt-1">
                    Join the {collection.name} community.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-sky-100 font-sans uppercase tracking-wider">Price</p>
                    <p className="text-xl font-display font-bold">
                      {formatEth(collection.mintPrice)} ETH
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="bg-white text-sky-600 hover:bg-sky-50 border-none shadow-md px-8"
                    loading={mintPending}
                    onClick={() => mint(address as `0x${string}`, collection.mintPrice!)}
                  >
                    Mint Now
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              {collection.maxSupply && collection.maxSupply > 0n && (
                <div className="mt-4">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-medium text-sky-100">Supply Progress</span>
                    <span className="text-xs font-bold">
                      {collection.totalSupply?.toString() || "0"} / {collection.maxSupply.toString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(collection.totalSupply || 0n) / Number(collection.maxSupply)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── User Holdings Management (Profile Style) ── */}
          <div className="mt-8">
              {/* Header Title */}
              <h2 className="text-base font-display font-bold text-cream-800 mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-sky-500" />
                Your Collection Management
              </h2>

              {/* Tabs Container (Matching Profile Style) */}
              <div className="flex gap-1 bg-white border border-cream-200 rounded-xl p-1 mb-6 w-fit shadow-sm">
                <button
                  onClick={() => setActiveUserTab("unlisted")}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all",
                    activeUserTab === "unlisted"
                      ? "bg-sky-500 text-white shadow-sm"
                      : "text-cream-500 hover:text-cream-800 hover:bg-cream-50"
                  )}
                >
                  <ImageIcon size={14} />
                  Unlisted NFTs ({ownedNFTs.filter(nft => !allListings.some(l => l.nftAddress.toLowerCase() === address.toLowerCase() && l.tokenId === nft.tokenId)).length})
                </button>
                <button
                  onClick={() => setActiveUserTab("listed")}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all",
                    activeUserTab === "listed"
                      ? "bg-sky-500 text-white shadow-sm"
                      : "text-cream-400 hover:text-cream-800 hover:bg-cream-50"
                  )}
                >
                  <Tag size={14} />
                  Listed NFTs ({ownedNFTs.filter(nft => allListings.some(l => l.nftAddress.toLowerCase() === address.toLowerCase() && l.tokenId === nft.tokenId)).length})
                </button>
              </div>

              {/* Content Area */}
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-cream-100 p-1">
                {ownedLoading ? (
                  <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide">
                    {[1, 2, 3, 4].map(i => (
                       <div key={i} className="w-32 h-40 shrink-0 rounded-2xl bg-cream-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto p-4 scrollbar-hide">
                    {(() => {
                      const filtered = activeUserTab === "unlisted" 
                        ? ownedNFTs.filter(nft => !allListings.some(l => l.nftAddress.toLowerCase() === address.toLowerCase() && l.tokenId === nft.tokenId))
                        : ownedNFTs.filter(nft => allListings.some(l => l.nftAddress.toLowerCase() === address.toLowerCase() && l.tokenId === nft.tokenId));

                      if (filtered.length === 0) {
                        return (
                          <div className="w-full py-12 text-center">
                            <ImageIcon size={32} className="text-cream-200 mx-auto mb-2" />
                            <p className="text-sm text-cream-400 font-sans">No items found in this category.</p>
                          </div>
                        );
                      }

                      return filtered.map(nft => {
                        const listing = allListings.find(l => l.nftAddress.toLowerCase() === address.toLowerCase() && l.tokenId === nft.tokenId);
                        
                        return (
                          <div key={nft.tokenId} className="group relative w-36 shrink-0 flex flex-col gap-3">
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-cream-200 shadow-sm group-hover:border-sky-300 group-hover:shadow-lg transition-all duration-500">
                               <Image 
                                 src={resolveIPFS(nft.metadata?.image || "/placeholder-nft.svg")}
                                 alt={`NFT ${nft.tokenId}`}
                                 fill
                                 className="object-cover group-hover:scale-110 transition-transform duration-700"
                                 unoptimized
                               />
                               <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-md px-2 py-1.5 flex items-center justify-center">
                                 <span className="text-[11px] font-display font-bold text-white tracking-wider">#{nft.tokenId}</span>
                               </div>
                            </div>
                            
                            {activeUserTab === "unlisted" ? (
                              <Button variant="primary" size="sm" className="h-8 text-[11px] py-0 px-3 bg-sky-500 hover:bg-sky-600 border-none shadow-sm rounded-xl">
                                List Item
                              </Button>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <p className="text-[11px] font-mono text-center text-cream-600 font-bold bg-cream-50 py-1 rounded-lg border border-cream-100">
                                  {formatEth(listing?.price || 0n)} ETH
                                </p>
                                <Button variant="ghost" size="sm" className="h-8 text-[11px] py-0 px-3 text-rose-500 hover:bg-rose-50 hover:text-rose-600 border-rose-100 rounded-xl">
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* ── Buy Modal ── */}
      <Modal open={!!buyModal} onClose={() => setBuyModal(null)} title="Confirm Purchase">
        {buyModal && (
          <div className="space-y-4">
            <PriceBreakdown priceWei={buyModal.price} royaltyBps={buyModal.royaltyBps || 0} />
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setBuyModal(null)}>Cancel</Button>
              <Button variant="primary" fullWidth loading={buyPending} onClick={handleBuy}>
                Buy · {formatEth(buyModal.price)} ETH
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
