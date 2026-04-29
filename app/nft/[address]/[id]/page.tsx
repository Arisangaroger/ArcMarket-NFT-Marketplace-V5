"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import Image from "next/image";
import Link from "next/link";
import { PriceBreakdown } from "@/components/nft/PriceBreakdown";
import { RoyaltyBadge } from "@/components/nft/RoyaltyBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useListing, useBuyItem, useListItem, useCancelListing, useUpdateListing } from "@/hooks/useListings";
import { useRoyaltyInfo } from "@/hooks/useRoyalties";
import { useApproval } from "@/hooks/useApproval";
import { formatEth, shortenAddress, resolveIPFS } from "@/lib/constants";
import {
  ArrowLeft, ExternalLink, Copy, Tag, ShoppingCart, Pencil,
  X, Plus, Gem, User, AlertCircle, CheckCircle2,
} from "lucide-react";
import { parseEther } from "viem";

// Mock NFT metadata — in production fetch from tokenURI
const MOCK_METADATA = {
  name: "Quantum Ape #1",
  description: "A quantum-entangled ape from the genesis collection. Each ape exists in a superposition of artistic states until observed.",
  image: "/placeholder-nft.svg",
  attributes: [
    { trait_type: "Background", value: "Quantum Blue" },
    { trait_type: "Fur", value: "Electric Gold" },
    { trait_type: "Eyes", value: "Laser" },
    { trait_type: "Hat", value: "Crown" },
    { trait_type: "Rarity", value: "Legendary" },
  ],
};

export default function NFTDetailPage() {
  const params = useParams();
  const nftAddress = params.address as `0x${string}`;
  const tokenId = params.id as string;
  const { address: userAddress } = useAccount();

  const { price, seller, isListed, refetch: refetchListing } = useListing(nftAddress, tokenId);
  const { royaltyBps, royaltyPercent, royaltyReceiver, hasRoyalty } = useRoyaltyInfo(nftAddress, tokenId);
  const { isApproved, approve, isPending: approvalPending, isSuccess: approvalSuccess } = useApproval(nftAddress, userAddress);

  const { buyItem, isPending: buyPending, isSuccess: buySuccess } = useBuyItem();
  const { listItem, isPending: listPending, isSuccess: listSuccess } = useListItem();
  const { cancelListing, isPending: cancelPending, isSuccess: cancelSuccess } = useCancelListing();
  const { updateListing, isPending: updatePending, isSuccess: updateSuccess } = useUpdateListing();

  const [listPrice, setListPrice] = useState("");
  const [updatePrice, setUpdatePrice] = useState("");
  const [listModal, setListModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [buyModal, setBuyModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = userAddress && seller && seller.toLowerCase() === userAddress.toLowerCase();
  const canBuy = isListed && !isOwner;

  // Refetch after tx success
  useEffect(() => {
    if (buySuccess || listSuccess || cancelSuccess || updateSuccess) {
      setTimeout(refetchListing, 3000);
    }
  }, [buySuccess, listSuccess, cancelSuccess, updateSuccess]);

  async function handleBuy() {
    await buyItem(nftAddress, tokenId, price);
    setBuyModal(false);
  }

  async function handleList() {
    if (!listPrice) return;
    if (!isApproved) {
      await approve();
      return;
    }
    await listItem(nftAddress, tokenId, listPrice);
    setListModal(false);
    setListPrice("");
  }

  async function handleUpdate() {
    if (!updatePrice) return;
    await updateListing(nftAddress, tokenId, updatePrice);
    setUpdateModal(false);
    setUpdatePrice("");
  }

  async function handleCancel() {
    await cancelListing(nftAddress, tokenId);
  }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-cream-500 hover:text-cream-800 font-sans mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Image + Traits ── */}
        <div className="space-y-4">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 border border-cream-200">
            <Image
              src={resolveIPFS(MOCK_METADATA.image)}
              alt={MOCK_METADATA.name}
              fill
              className="object-cover"
              unoptimized
            />
            {hasRoyalty && (
              <div className="absolute top-3 left-3">
                <RoyaltyBadge hasRoyalty royaltyPercent={royaltyPercent} size="md" />
              </div>
            )}
          </div>

          {/* Traits */}
          <div className="bg-white rounded-2xl border border-cream-200 p-5">
            <h3 className="text-sm font-display font-semibold text-cream-700 mb-3">Attributes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOCK_METADATA.attributes.map((attr) => (
                <div key={attr.trait_type} className="bg-cream-50 rounded-xl p-2.5 border border-cream-100">
                  <p className="text-xs text-cream-400 font-sans mb-0.5">{attr.trait_type}</p>
                  <p className="text-sm font-display font-semibold text-cream-800 truncate">{String(attr.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Details + Actions ── */}
        <div className="space-y-5">
          {/* Name + Collection */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href={`/collection/${nftAddress}`} className="text-sm text-sky-500 hover:text-sky-700 font-sans transition-colors">
                Quantum Apes
              </Link>
              <span className="text-cream-300">·</span>
              <code className="text-sm font-mono text-cream-400">#{tokenId}</code>
            </div>
            <h1 className="text-3xl font-display font-bold text-cream-900 mb-2">{MOCK_METADATA.name}</h1>
            <p className="text-sm text-cream-500 font-sans leading-relaxed">{MOCK_METADATA.description}</p>
          </div>

          {/* Seller / Contract info */}
          <div className="grid grid-cols-2 gap-3">
            {seller && (
              <div className="bg-cream-50 rounded-xl p-3">
                <p className="text-xs text-cream-400 font-sans mb-1 flex items-center gap-1">
                  <User size={10} /> Seller
                </p>
                <div className="flex items-center gap-1">
                  <code className="text-sm font-mono text-cream-800">{shortenAddress(seller)}</code>
                  <button onClick={() => copyAddress(seller)} className="text-cream-300 hover:text-cream-600">
                    <Copy size={11} />
                  </button>
                </div>
              </div>
            )}
            <div className="bg-cream-50 rounded-xl p-3">
              <p className="text-xs text-cream-400 font-sans mb-1 flex items-center gap-1">
                <Tag size={10} /> Contract
              </p>
              <div className="flex items-center gap-1">
                <code className="text-sm font-mono text-cream-800">{shortenAddress(nftAddress)}</code>
                <a href={`https://etherscan.io/address/${nftAddress}`} target="_blank" rel="noopener noreferrer" className="text-cream-300 hover:text-sky-500">
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          {/* ── ROYALTY INFO ── */}
          <div className={`rounded-xl border p-4 ${hasRoyalty ? "bg-violet-50 border-violet-100" : "bg-cream-50 border-cream-100"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Gem size={14} className={hasRoyalty ? "text-violet-500" : "text-cream-300"} />
              <p className="text-sm font-display font-semibold text-cream-700">Royalty Info</p>
            </div>
            {hasRoyalty ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-cream-500 font-sans">Rate</span>
                  <span className="font-display font-semibold text-violet-700">{royaltyPercent}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cream-500 font-sans">Receiver</span>
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-mono text-violet-700">
                      {shortenAddress(royaltyReceiver || "")}
                    </code>
                    {royaltyReceiver && (
                      <a href={`https://etherscan.io/address/${royaltyReceiver}`} target="_blank" rel="noopener noreferrer" className="text-violet-400">
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs text-violet-500 font-sans mt-1">
                  ERC-2981 · Creator earns {royaltyPercent}% on every resale
                </p>
              </div>
            ) : (
              <p className="text-sm text-cream-400 font-sans">
                This NFT has no on-chain royalties (ERC-2981 not supported by this contract).
              </p>
            )}
          </div>

          {/* ── PRICE BREAKDOWN ── */}
          {isListed && (
            <PriceBreakdown priceWei={price} royaltyBps={royaltyBps} />
          )}

          {/* ── ACTION PANEL ── */}
          <div className="bg-white rounded-2xl border border-cream-200 p-5 space-y-3">
            {isListed ? (
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <p className="text-xs text-cream-400 font-sans mb-0.5">Current price</p>
                  <p className="text-3xl font-display font-bold text-cream-900">
                    {formatEth(price)} <span className="text-lg font-normal text-cream-400">ETH</span>
                  </p>
                </div>
                <Badge variant="sky" size="md">Listed</Badge>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-cream-400 font-sans">Not listed for sale</p>
              </div>
            )}

            {/* Approval warning */}
            {isOwner && !isListed && !isApproved && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-sans">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                You need to approve the marketplace to manage this collection before listing.
              </div>
            )}
            {approvalSuccess && (
              <div className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-100 rounded-xl text-xs text-sage-700 font-sans">
                <CheckCircle2 size={13} className="shrink-0" />
                Marketplace approved! You can now list your NFT.
              </div>
            )}

            {/* Buyer */}
            {canBuy && (
              <Button variant="primary" fullWidth size="lg" onClick={() => setBuyModal(true)}>
                <ShoppingCart size={16} />
                Buy Now · {formatEth(price)} ETH
              </Button>
            )}

            {/* Owner + Listed */}
            {isOwner && isListed && (
              <div className="flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => setUpdateModal(true)}>
                  <Pencil size={14} />
                  Update Price
                </Button>
                <Button variant="danger" fullWidth loading={cancelPending} onClick={handleCancel}>
                  <X size={14} />
                  Cancel
                </Button>
              </div>
            )}

            {/* Owner + Not Listed */}
            {isOwner && !isListed && (
              <>
                {!isApproved ? (
                  <Button variant="secondary" fullWidth loading={approvalPending} onClick={approve}>
                    Approve Marketplace
                  </Button>
                ) : (
                  <Button variant="primary" fullWidth onClick={() => setListModal(true)}>
                    <Plus size={14} />
                    List for Sale
                  </Button>
                )}
              </>
            )}

            {!isOwner && !isListed && (
              <p className="text-sm text-center text-cream-400 font-sans py-2">
                This NFT is not listed for sale.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Buy Modal ── */}
      <Modal open={buyModal} onClose={() => setBuyModal(false)} title="Confirm Purchase">
        <div className="space-y-4">
          <div className="p-3 bg-cream-50 rounded-xl border border-cream-100">
            <p className="text-sm font-display font-semibold text-cream-900">{MOCK_METADATA.name}</p>
            <p className="text-xs text-cream-400 font-sans mt-0.5">#{tokenId}</p>
          </div>
          <PriceBreakdown priceWei={price} royaltyBps={royaltyBps} />
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setBuyModal(false)}>Cancel</Button>
            <Button variant="primary" fullWidth loading={buyPending} onClick={handleBuy}>
              Confirm · {formatEth(price)} ETH
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── List Modal ── */}
      <Modal open={listModal} onClose={() => setListModal(false)} title="List for Sale">
        <div className="space-y-4">
          <Input
            label="Price (ETH)"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.5"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            suffix="ETH"
            hint="Set your listing price in ETH."
          />
          {listPrice && parseFloat(listPrice) > 0 && (
            <PriceBreakdown priceWei={parseEther(listPrice || "0")} royaltyBps={royaltyBps} />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setListModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              fullWidth
              loading={listPending}
              disabled={!listPrice || parseFloat(listPrice) <= 0}
              onClick={handleList}
            >
              List for {listPrice || "—"} ETH
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Update Price Modal ── */}
      <Modal open={updateModal} onClose={() => setUpdateModal(false)} title="Update Price">
        <div className="space-y-4">
          <Input
            label="New Price (ETH)"
            type="number"
            step="0.001"
            min="0"
            placeholder={formatEth(price)}
            value={updatePrice}
            onChange={(e) => setUpdatePrice(e.target.value)}
            suffix="ETH"
          />
          {updatePrice && parseFloat(updatePrice) > 0 && (
            <PriceBreakdown priceWei={parseEther(updatePrice || "0")} royaltyBps={royaltyBps} />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setUpdateModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              fullWidth
              loading={updatePending}
              disabled={!updatePrice || parseFloat(updatePrice) <= 0}
              onClick={handleUpdate}
            >
              Update to {updatePrice || "—"} ETH
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
