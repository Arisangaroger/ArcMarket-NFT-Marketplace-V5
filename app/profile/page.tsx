"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { EarningsPanel } from "@/components/nft/EarningsPanel";
import { NFTCard } from "@/components/nft/NFTCard";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PriceBreakdown } from "@/components/nft/PriceBreakdown";
import { useUpdateListing, useCancelListing, useBuyItem } from "@/hooks/useListings";
import { shortenAddress, formatEth } from "@/lib/constants";
import { NFTListing } from "@/lib/types";
import {
  Wallet, Image as ImageIcon, Tag, DollarSign,
  Pencil, X, ExternalLink, Copy, Gem,
} from "lucide-react";
import { parseEther } from "viem";
import { clsx } from "clsx";

type Tab = "nfts" | "listings" | "earnings";

// ── Mock data ─────────────────────────────────────────────────────
const MOCK_MY_NFTS: NFTListing[] = [
  { nftAddress: "0xCol1", tokenId: "3", price: 0n, seller: "0xMe", collectionName: "Quantum Apes", hasRoyalty: true, royaltyBps: 500, metadata: { name: "Quantum Ape #3", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCol1", tokenId: "14", price: 0n, seller: "0xMe", collectionName: "Quantum Apes", hasRoyalty: true, royaltyBps: 500, metadata: { name: "Quantum Ape #14", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCol2", tokenId: "77", price: 0n, seller: "0xMe", collectionName: "Neon Cats", hasRoyalty: false, royaltyBps: 0, metadata: { name: "Neon Cat #77", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCol3", tokenId: "5", price: 0n, seller: "0xMe", collectionName: "Pixel Punks", hasRoyalty: true, royaltyBps: 250, metadata: { name: "Pixel Punk #5", description: "", image: "/placeholder-nft.svg" } },
];

const MOCK_MY_LISTINGS: NFTListing[] = [
  { nftAddress: "0xCol1", tokenId: "7", price: parseEther("1.5"), seller: "0xMe", collectionName: "Quantum Apes", hasRoyalty: true, royaltyBps: 500, metadata: { name: "Quantum Ape #7", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCol3", tokenId: "99", price: parseEther("0.35"), seller: "0xMe", collectionName: "Pixel Punks", hasRoyalty: true, royaltyBps: 250, metadata: { name: "Pixel Punk #99", description: "", image: "/placeholder-nft.svg" } },
  { nftAddress: "0xCol2", tokenId: "21", price: parseEther("2.0"), seller: "0xMe", collectionName: "Neon Cats", hasRoyalty: false, royaltyBps: 0, metadata: { name: "Neon Cat #21", description: "", image: "/placeholder-nft.svg" } },
];

// Group NFTs by collection
function groupByCollection(nfts: NFTListing[]) {
  return nfts.reduce<Record<string, NFTListing[]>>((acc, nft) => {
    const key = nft.collectionName || nft.nftAddress;
    if (!acc[key]) acc[key] = [];
    acc[key].push(nft);
    return acc;
  }, {});
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("nfts");
  const [editListing, setEditListing] = useState<NFTListing | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [copied, setCopied] = useState(false);

  const { updateListing, isPending: updatePending } = useUpdateListing();
  const { cancelListing, isPending: cancelPending } = useCancelListing();

  const grouped = groupByCollection(MOCK_MY_NFTS);

  async function handleUpdate() {
    if (!editListing || !newPrice) return;
    await updateListing(editListing.nftAddress as `0x${string}`, editListing.tokenId, newPrice);
    setEditListing(null);
    setNewPrice("");
  }

  async function handleCancel(listing: NFTListing) {
    await cancelListing(listing.nftAddress as `0x${string}`, listing.tokenId);
  }

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
          <Wallet size={28} className="text-sky-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-cream-900 mb-2">Connect Your Wallet</h2>
        <p className="text-cream-500 font-sans">Connect your wallet to view your NFTs, listings, and earnings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Profile Header ── */}
      <div className="bg-white rounded-2xl border border-cream-200 p-6 mb-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-200 to-violet-200 flex items-center justify-center shrink-0">
              <span className="text-xl font-display font-bold text-sky-700">
                {address?.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <code className="text-base font-mono font-semibold text-cream-900">
                  {shortenAddress(address!)}
                </code>
                <button onClick={copyAddress} className="text-cream-300 hover:text-cream-600 transition-colors">
                  <Copy size={13} />
                </button>
                <a
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream-300 hover:text-sky-500 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
              {copied && <p className="text-xs text-sage-600 font-sans">Copied!</p>}
              <p className="text-sm text-cream-400 font-sans mt-0.5">
                {MOCK_MY_NFTS.length} NFTs · {MOCK_MY_LISTINGS.length} listed
              </p>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 text-center min-w-[80px]">
              <p className="text-xs text-sky-400 font-sans">NFTs</p>
              <p className="text-lg font-display font-bold text-sky-700">{MOCK_MY_NFTS.length}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center min-w-[80px]">
              <p className="text-xs text-amber-400 font-sans">Listed</p>
              <p className="text-lg font-display font-bold text-amber-700">{MOCK_MY_LISTINGS.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white border border-cream-200 rounded-xl p-1 mb-7 w-fit">
        {([
          { key: "nfts", label: "My NFTs", icon: <ImageIcon size={14} /> },
          { key: "listings", label: "My Listings", icon: <Tag size={14} /> },
          { key: "earnings", label: "Earnings", icon: <DollarSign size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display font-medium transition-all",
              tab === t.key
                ? "bg-sky-500 text-white shadow-sm"
                : "text-cream-500 hover:text-cream-800 hover:bg-cream-50"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: My NFTs ── */}
      {tab === "nfts" && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([collection, nfts]) => (
            <div key={collection}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-display font-semibold text-cream-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                  {collection}
                  <Badge variant="gray">{nfts.length}</Badge>
                </h3>
                <Link
                  href={`/collection/${nfts[0].nftAddress}`}
                  className="text-xs text-sky-500 hover:text-sky-700 font-sans transition-colors"
                >
                  View collection →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {nfts.map((nft) => (
                  <NFTCard key={nft.tokenId} listing={nft} />
                ))}
              </div>
            </div>
          ))}
          {MOCK_MY_NFTS.length === 0 && (
            <div className="text-center py-16">
              <ImageIcon size={32} className="text-cream-300 mx-auto mb-3" />
              <p className="text-cream-400 font-sans">No NFTs found in your wallet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: My Listings ── */}
      {tab === "listings" && (
        <div className="space-y-3">
          {MOCK_MY_LISTINGS.length === 0 ? (
            <div className="text-center py-16">
              <Tag size={32} className="text-cream-300 mx-auto mb-3" />
              <p className="text-cream-400 font-sans">You have no active listings.</p>
            </div>
          ) : (
            MOCK_MY_LISTINGS.map((listing) => (
              <div
                key={`${listing.nftAddress}-${listing.tokenId}`}
                className="bg-white rounded-2xl border border-cream-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* NFT info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cream-100 overflow-hidden shrink-0 flex items-center justify-center text-cream-400">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-cream-900">
                      {listing.metadata?.name || `NFT #${listing.tokenId}`}
                    </p>
                    <p className="text-xs text-cream-400 font-sans">{listing.collectionName} · #{listing.tokenId}</p>
                    {listing.hasRoyalty && (
                      <span className="inline-flex items-center gap-1 text-xs text-violet-600 font-sans mt-0.5">
                        <Gem size={10} /> {listing.royaltyBps! / 100}% royalty on resale
                      </span>
                    )}
                  </div>
                </div>

                {/* Price + Actions */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-right">
                    <p className="text-xs text-cream-400 font-sans">Listed at</p>
                    <p className="text-lg font-display font-bold text-cream-900">
                      {formatEth(listing.price)} <span className="text-sm font-normal text-cream-400">ETH</span>
                    </p>
                  </div>

                  {/* Inline edit */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setEditListing(listing); setNewPrice(formatEth(listing.price)); }}
                  >
                    <Pencil size={12} />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={cancelPending}
                    onClick={() => handleCancel(listing)}
                  >
                    <X size={12} />
                    Cancel
                  </Button>
                  <Link
                    href={`/nft/${listing.nftAddress}/${listing.tokenId}`}
                    className="p-1.5 text-cream-400 hover:text-sky-500 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Earnings ── */}
      {tab === "earnings" && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-base font-display font-semibold text-cream-800 mb-1">Your Earnings</h2>
            <p className="text-sm text-cream-400 font-sans">
              Sale proceeds and creator royalties are kept separate for full transparency.
              Withdraw each independently.
            </p>
          </div>
          <EarningsPanel />

          {/* Explainer */}
          <div className="bg-cream-50 border border-cream-100 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-display font-semibold text-cream-700">How earnings work</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                  <DollarSign size={10} className="text-sky-600" />
                </div>
                <p className="text-xs text-cream-500 font-sans">
                  <strong className="text-cream-700">Sale Earnings</strong> — When one of your listed NFTs sells,
                  the net proceeds (after royalty and platform fee) are credited here. Withdraw anytime.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Gem size={10} className="text-violet-600" />
                </div>
                <p className="text-xs text-cream-500 font-sans">
                  <strong className="text-cream-700">Creator Royalties</strong> — If you are the royalty receiver
                  on an ERC-2981 contract, every secondary sale of those NFTs earns you a royalty.
                  These are tracked separately and can be withdrawn independently.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Price Modal ── */}
      <Modal
        open={!!editListing}
        onClose={() => { setEditListing(null); setNewPrice(""); }}
        title="Update Listing Price"
        size="md"
      >
        {editListing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl border border-cream-100">
              <div className="w-10 h-10 rounded-xl bg-cream-200 flex items-center justify-center text-cream-400 shrink-0">
                <ImageIcon size={14} />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-cream-900">{editListing.metadata?.name}</p>
                <p className="text-xs text-cream-400 font-sans">
                  Current: {formatEth(editListing.price)} ETH
                </p>
              </div>
            </div>

            <Input
              label="New Price (ETH)"
              type="number"
              step="0.001"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              suffix="ETH"
              hint="Enter the new listing price."
            />

            {newPrice && parseFloat(newPrice) > 0 && (
              <PriceBreakdown
                priceWei={parseEther(newPrice)}
                royaltyBps={editListing.royaltyBps || 0}
              />
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => { setEditListing(null); setNewPrice(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={updatePending}
                disabled={!newPrice || parseFloat(newPrice) <= 0}
                onClick={handleUpdate}
              >
                Update to {newPrice || "—"} ETH
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
