"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";
import { NFTCard } from "@/components/nft/NFTCard";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PriceBreakdown } from "@/components/nft/PriceBreakdown";
import { useCollections, useUserCollectionNFTs } from "@/hooks/useCollections";
import { useEarnings } from "@/hooks/useEarnings";
import { useUpdateListing, useCancelListing } from "@/hooks/useListings";
import { useMarketplaceState } from "@/hooks/useMarketplaceState";
import { shortenAddress, formatEth, ERC721_ABI, resolveIPFS, COLLECTION_ABI } from "@/lib/constants";
import { COLLECTION_ADDRESSES } from "@/lib/collections-config";
import { NFTListing } from "@/lib/types";
import {
  Wallet, Image as ImageIcon, Tag, DollarSign,
  Pencil, X, ExternalLink, Copy, Gem, Loader2, TrendingUp, Zap
} from "lucide-react";
import { parseEther } from "viem";
import { clsx } from "clsx";
import { usePublicClient } from "wagmi";
import { useEffect, useCallback } from "react";

type Tab = "nfts" | "listings" | "earnings";

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
  const [mounted, setMounted] = useState(false);
  // Earnings & Withdrawals
  const { balances, actions, isWithdrawing, withdrawType, isOwner } = useEarnings();

  const [tab, setTab] = useState<Tab>("nfts");

  useEffect(() => {
    setMounted(true);
  }, []);
  const [editListing, setEditListing] = useState<NFTListing | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);

  const [myOwnedNfts, setMyOwnedNfts] = useState<NFTListing[]>([]);

  const { listings: allListings, isLoading: isLoadingListings, refetch: refetchMarketplace } = useMarketplaceState();
  const publicClient = usePublicClient();

  console.log("ProfilePage debug:", {
    connectedAddress: address,
    isConnected,
    allListingsLength: allListings.length,
    allListings: allListings.map((l) => ({ tokenId: l.tokenId, seller: l.seller, nftAddress: l.nftAddress })),
  });

  // 1. Get real listings by current user
  const myListings = allListings.filter(
    (l) => l.seller.toLowerCase() === address?.toLowerCase()
  );

  console.log("ProfilePage myListings:", myListings);

  // 2. Fetch owned NFTs (Scanner)
  const fetchOwnedNfts = useCallback(async () => {
    if (!address || !publicClient) return;
    setIsLoadingNfts(true);
    try {
      const owned: NFTListing[] = [];
      const userLower = address.toLowerCase();
      
      // Scan each registered collection
      for (const colAddress of COLLECTION_ADDRESSES) {
        try {
          // Get collection stats
          const [name, symbol, totalSupplyRaw] = await Promise.all([
            publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "name" }),
            publicClient.readContract({ address: colAddress, abi: ERC721_ABI, functionName: "symbol" }),
            publicClient.readContract({ address: colAddress, abi: COLLECTION_ABI, functionName: "totalSupply" }).catch(() => 0n),
          ]) as [string, string, bigint];

          const totalSupply = Number(totalSupplyRaw);
          const colName = name || symbol || "Unknown Collection";

          // If totalSupply is 0, we might still have tokens if it's not implemented or starting at 1
          // We scan up to totalSupply or a reasonable max for small collections
          const maxToScan = totalSupply > 0 ? totalSupply : 20; 
          
          const ownerPromises = [];
          for (let i = 1; i <= maxToScan; i++) {
            ownerPromises.push(
              publicClient.readContract({
                address: colAddress,
                abi: ERC721_ABI,
                functionName: "ownerOf",
                args: [BigInt(i)],
              }).then(owner => ({ id: i, owner: (owner as string).toLowerCase() }))
                .catch(() => null)
            );
          }

          const owners = await Promise.all(ownerPromises);
          
          for (const item of owners) {
            if (item && item.owner === userLower) {
              const tokenId = item.id.toString();
              
              // Fetch metadata
              let metadata = { name: `${colName} #${tokenId}`, description: "", image: "" };
              try {
                const tokenURI = await publicClient.readContract({
                  address: colAddress,
                  abi: ERC721_ABI,
                  functionName: "tokenURI",
                  args: [BigInt(tokenId)],
                }) as string;
                
                const res = await fetch(resolveIPFS(tokenURI));
                const data = await res.json();
                metadata = {
                  name: data.name || metadata.name,
                  description: data.description || "",
                  image: data.image || "",
                };
              } catch (e) {}

              owned.push({
                nftAddress: colAddress,
                tokenId,
                price: 0n,
                seller: item.owner,
                collectionName: colName,
                metadata
              });
            }
          }
        } catch (e) {
          console.error(`Error scanning collection ${colAddress}:`, e);
        }
      }
      
      setMyOwnedNfts(owned); 
    } catch (e) {
      console.error("Error scanning owned NFTs:", e);
    } finally {
      setIsLoadingNfts(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchOwnedNfts();
  }, [address, publicClient]);

  const handleSuccess = useCallback(() => {
    refetchMarketplace();
    fetchOwnedNfts();
  }, [refetchMarketplace, fetchOwnedNfts]);

  const { updateListing, isPending: updatePending } = useUpdateListing(handleSuccess);
  const { cancelListing, isPending: cancelPending } = useCancelListing(handleSuccess);

  const grouped = groupByCollection(myOwnedNfts);

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

  if (!mounted) return null;

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
                {isLoadingNfts ? "..." : myOwnedNfts.length} NFTs · {isLoadingListings ? "..." : myListings.length} listed
              </p>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 text-center min-w-[80px]">
              <p className="text-xs text-sky-400 font-sans">NFTs</p>
              <p className="text-lg font-display font-bold text-sky-700">
                {isLoadingNfts ? <Loader2 size={14} className="animate-spin inline" /> : myOwnedNfts.length}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center min-w-[80px]">
              <p className="text-xs text-amber-400 font-sans">Listed</p>
              <p className="text-lg font-display font-bold text-amber-700">
                {isLoadingListings ? <Loader2 size={14} className="animate-spin inline" /> : myListings.length}
              </p>
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
                  <NFTCard key={`${nft.nftAddress}-${nft.tokenId}`} listing={nft} />
                ))}
              </div>
            </div>
          ))}
          {!isLoadingNfts && myOwnedNfts.length === 0 && (
            <div className="text-center py-16">
              <ImageIcon size={32} className="text-cream-300 mx-auto mb-3" />
              <p className="text-cream-400 font-sans">No NFTs found in your wallet.</p>
            </div>
          )}
          {isLoadingNfts && (
            <div className="text-center py-16">
              <Loader2 size={32} className="text-sky-500 animate-spin mx-auto mb-3" />
              <p className="text-cream-400 font-sans">Scanning your wallet for NFTs...</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: My Listings ── */}
      {tab === "listings" && (
        <div className="space-y-8">
          {Object.entries(groupByCollection(myListings)).map(([collection, listings]) => (
            <div key={collection}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-display font-semibold text-cream-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  {collection}
                  <Badge variant="gray">{listings.length}</Badge>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <NFTCard
                    key={`${listing.nftAddress}-${listing.tokenId}`}
                    listing={listing}
                    onEdit={setEditListing}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </div>
          ))}
          {!isLoadingListings && myListings.length === 0 && (
            <div className="text-center py-16">
              <Tag size={32} className="text-cream-300 mx-auto mb-3" />
              <p className="text-cream-400 font-sans">You have no active listings.</p>
            </div>
          )}
          {isLoadingListings && (
            <div className="text-center py-16">
              <Loader2 size={32} className="text-sky-500 animate-spin mx-auto mb-3" />
              <p className="text-cream-400 font-sans">Fetching your active listings...</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: My Earnings ── */}
      {tab === "earnings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Sales Proceeds */}
          <div className={clsx(
            "rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300",
            balances.proceeds > 0n 
              ? "bg-white border-cream-200 shadow-sm hover:shadow-md" 
              : "bg-cream-50/50 border-cream-100 opacity-80"
          )}>
            <div>
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                balances.proceeds > 0n ? "bg-sky-50 text-sky-500" : "bg-cream-100 text-cream-400"
              )}>
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-display font-bold text-cream-900 mb-1">Sales Proceeds</h3>
              <p className="text-sm text-cream-500 font-sans mb-6">
                Earnings from NFTs you have sold on the marketplace.
              </p>
            </div>
            <div>
              <div className="mb-6">
                <p className="text-xs text-cream-400 font-sans uppercase tracking-widest mb-1">Available to withdraw</p>
                <p className={clsx(
                  "text-3xl font-display font-bold",
                  balances.proceeds > 0n ? "text-cream-900" : "text-cream-300"
                )}>
                  {formatEth(balances.proceeds)} <span className="text-sm font-normal text-cream-400">ETH</span>
                </p>
              </div>
              <Button 
                variant="primary" 
                fullWidth 
                disabled={balances.proceeds === 0n}
                loading={isWithdrawing && withdrawType === "proceeds"}
                onClick={actions.withdrawProceeds}
                className={balances.proceeds === 0n ? "bg-sky-100 text-sky-600 border-none cursor-not-allowed disabled:opacity-100 hover:bg-sky-100 active:scale-100" : ""}
              >
                {balances.proceeds > 0n ? "Withdraw Proceeds" : "No Proceeds Available"}
              </Button>
            </div>
          </div>

          {/* 2. Creator Royalties */}
          <div className={clsx(
            "rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300",
            balances.royalties > 0n 
              ? "bg-white border-cream-200 shadow-sm hover:shadow-md" 
              : "bg-cream-50/50 border-cream-100 opacity-80"
          )}>
            <div>
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                balances.royalties > 0n ? "bg-violet-50 text-violet-500" : "bg-cream-100 text-cream-400"
              )}>
                <Gem size={24} />
              </div>
              <h3 className="text-lg font-display font-bold text-cream-900 mb-1">Creator Royalties</h3>
              <p className="text-sm text-cream-500 font-sans mb-6">
                Passive income earned from secondary sales of your creations.
              </p>
            </div>
            <div>
              <div className="mb-6">
                <p className="text-xs text-cream-400 font-sans uppercase tracking-widest mb-1">Available to withdraw</p>
                <p className={clsx(
                  "text-3xl font-display font-bold",
                  balances.royalties > 0n ? "text-cream-900" : "text-cream-300"
                )}>
                  {formatEth(balances.royalties)} <span className="text-sm font-normal text-cream-400">ETH</span>
                </p>
              </div>
              <Button 
                variant={balances.royalties > 0n ? "secondary" : "ghost"}
                fullWidth 
                disabled={balances.royalties === 0n}
                loading={isWithdrawing && withdrawType === "royalties"}
                onClick={actions.withdrawRoyalties}
                className={clsx(
                  balances.royalties > 0n && "border-violet-200 text-violet-700 hover:bg-violet-50",
                  balances.royalties === 0n && "bg-sky-100 text-sky-600 border-none cursor-not-allowed disabled:opacity-100 hover:bg-sky-100 active:scale-100"
                )}
              >
                {balances.royalties > 0n ? "Withdraw Royalties" : "No Royalties Available"}
              </Button>
            </div>
          </div>

          {/* 3. Marketplace Fees (Admin Only) */}
          {isOwner && (
            <div className={clsx(
              "rounded-2xl p-6 flex flex-col justify-between shadow-lg ring-1 ring-white/10 relative overflow-hidden transition-all duration-300",
              balances.fees > 0n ? "bg-cream-900" : "bg-cream-800 opacity-90"
            )}>
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/20 blur-3xl rounded-full" />
              
              <div className="relative">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md",
                  balances.fees > 0n ? "bg-white/10 text-sky-400" : "bg-white/5 text-sky-900"
                )}>
                  <Zap size={24} />
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-1">Platform Fees</h3>
                <p className="text-sm text-cream-300 font-sans mb-6">
                  Total revenue collected from marketplace service fees (2%).
                </p>
              </div>
              <div className="relative">
                <div className="mb-6">
                  <p className="text-xs text-cream-400 font-sans uppercase tracking-widest mb-1">Admin Balance</p>
                  <p className={clsx(
                    "text-3xl font-display font-bold",
                    balances.fees > 0n ? "text-white" : "text-white/40"
                  )}>
                    {formatEth(balances.fees)} <span className="text-sm font-normal text-cream-500">ETH</span>
                  </p>
                </div>
                <Button 
                  variant="primary" 
                  fullWidth 
                  disabled={balances.fees === 0n}
                  loading={isWithdrawing && withdrawType === "fees"}
                  onClick={actions.withdrawMarketplaceFees}
                  className={clsx(
                    "bg-sky-500 hover:bg-sky-400 text-white border-none",
                    balances.fees === 0n && "bg-white/10 text-white/30 cursor-not-allowed hover:bg-white/10"
                  )}
                >
                  {balances.fees > 0n ? "Withdraw Admin Fees" : "No Fees Collected"}
                </Button>
              </div>
            </div>
          )}
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
