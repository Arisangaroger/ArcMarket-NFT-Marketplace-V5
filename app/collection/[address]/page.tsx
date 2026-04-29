"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { NFTCard } from "@/components/nft/NFTCard";
import { RoyaltyBadge } from "@/components/nft/RoyaltyBadge";
import { Modal } from "@/components/ui/Modal";
import { PriceBreakdown } from "@/components/nft/PriceBreakdown";
import { Button } from "@/components/ui/Button";
import { useBuyItem } from "@/hooks/useListings";
import { formatEth, shortenAddress } from "@/lib/constants";
import { NFTListing, Collection } from "@/lib/types";
import { Gem, Copy, ExternalLink, TrendingUp, Tag, Users } from "lucide-react";
import { parseEther } from "viem";

// Mock — replace with real subgraph/contract reads keyed by address
const MOCK_COLLECTION: Collection = {
  address: "0xCollection1",
  name: "Quantum Apes",
  symbol: "QA",
  creatorAddress: "0xCreator1abcdef123456",
  royaltyBps: 500,
  royaltyReceiver: "0xCreator1abcdef123456",
  hasRoyalty: true,
  totalVolume: parseEther("48.2"),
  totalRoyaltiesPaid: parseEther("2.41"),
  floorPrice: parseEther("0.8"),
  listedCount: 24,
  description: "A collection of 5,000 quantum-entangled ape portraits exploring the intersection of art and DeFi. Royalties support ongoing creator development.",
};

const MOCK_LISTINGS: NFTListing[] = [
  { nftAddress: "0xCollection1", tokenId: "1", price: parseEther("1.5"), seller: "0xSeller1abc", collectionName: "Quantum Apes", hasRoyalty: true, royaltyBps: 500, royaltyReceiver: "0xCreator1", metadata: { name: "Quantum Ape #1", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCollection1", tokenId: "7", price: parseEther("0.8"), seller: "0xSeller2abc", collectionName: "Quantum Apes", hasRoyalty: true, royaltyBps: 500, royaltyReceiver: "0xCreator1", metadata: { name: "Quantum Ape #7", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCollection1", tokenId: "23", price: parseEther("2.1"), seller: "0xSeller3abc", collectionName: "Quantum Apes", hasRoyalty: true, royaltyBps: 500, royaltyReceiver: "0xCreator1", metadata: { name: "Quantum Ape #23", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCollection1", tokenId: "88", price: parseEther("1.0"), seller: "0xSeller4abc", collectionName: "Quantum Apes", hasRoyalty: true, royaltyBps: 500, royaltyReceiver: "0xCreator1", metadata: { name: "Quantum Ape #88", description: "", image: "/placeholder-nft.svg" } },
];

export default function CollectionPage() {
  const params = useParams();
  const address = params.address as string;
  const [buyModal, setBuyModal] = useState<NFTListing | null>(null);
  const [copied, setCopied] = useState(false);
  const { buyItem, isPending } = useBuyItem();

  const collection = MOCK_COLLECTION; // In production: fetch by address
  const listings = MOCK_LISTINGS;

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Collection Header ── */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden mb-8">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-sky-50 via-violet-50 to-sky-50" />

        <div className="px-6 pb-6">
          {/* Avatar + name row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-cream-200 shadow flex items-center justify-center shrink-0">
              <span className="text-2xl font-display font-bold text-sky-500">
                {collection.symbol.slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-cream-900">{collection.name}</h1>
                <span className="text-sm text-cream-400 font-mono">{collection.symbol}</span>
                <RoyaltyBadge
                  hasRoyalty={collection.hasRoyalty}
                  royaltyPercent={collection.royaltyBps / 100}
                  size="md"
                />
              </div>
              <p className="text-sm text-cream-500 font-sans mt-1 max-w-xl">{collection.description}</p>
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
        </div>
      </div>

      {/* ── Listings Grid ── */}
      <h2 className="text-base font-display font-semibold text-cream-800 mb-4">
        {listings.length} item{listings.length !== 1 ? "s" : ""} listed
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {listings.map((l) => (
          <NFTCard key={l.tokenId} listing={l} onQuickBuy={setBuyModal} />
        ))}
      </div>

      {/* ── Buy Modal ── */}
      <Modal open={!!buyModal} onClose={() => setBuyModal(null)} title="Confirm Purchase">
        {buyModal && (
          <div className="space-y-4">
            <PriceBreakdown priceWei={buyModal.price} royaltyBps={buyModal.royaltyBps || 0} />
            <div className="flex gap-2 pt-1">
              <Button variant="ghost" fullWidth onClick={() => setBuyModal(null)}>Cancel</Button>
              <Button variant="primary" fullWidth loading={isPending} onClick={handleBuy}>
                Buy · {formatEth(buyModal.price)} ETH
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
