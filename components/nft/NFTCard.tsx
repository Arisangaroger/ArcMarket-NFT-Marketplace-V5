"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Eye, Gem } from "lucide-react";
import { NFTListing } from "@/lib/types";
import { formatEth, shortenAddress, resolveIPFS } from "@/lib/constants";
import { RoyaltyBadge } from "./RoyaltyBadge";
import { clsx } from "clsx";

interface NFTCardProps {
  listing: NFTListing;
  onQuickBuy?: (listing: NFTListing) => void;
  variant?: "default" | "compact";
}

export function NFTCard({ listing, onQuickBuy, variant = "default" }: NFTCardProps) {
  const isCompact = variant === "compact";
  const [hovered, setHovered] = useState(false);
  const imageUrl = resolveIPFS(listing.metadata?.image || "");

  return (
    <div
      className={clsx(
        "group relative bg-white border border-cream-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-cream-300",
        isCompact ? "rounded-xl" : "rounded-2xl"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        <Image
          src={imageUrl}
          alt={listing.metadata?.name || `NFT #${listing.tokenId}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />

        {/* Hover overlay */}
        <div
          className={clsx(
            "absolute inset-0 bg-cream-900/50 flex items-center justify-center gap-3 transition-opacity duration-200",
            hovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Link
            href={`/nft/${listing.nftAddress}/${listing.tokenId}`}
            className="flex items-center gap-1.5 bg-white text-cream-800 text-xs font-display font-semibold px-3 py-2 rounded-xl hover:bg-cream-100 transition-colors"
          >
            <Eye size={13} />
            Details
          </Link>
          {onQuickBuy && (
            <button
              onClick={() => onQuickBuy(listing)}
              className="flex items-center gap-1.5 bg-sky-500 text-white text-xs font-display font-semibold px-3 py-2 rounded-xl hover:bg-sky-600 transition-colors"
            >
              <ShoppingCart size={13} />
              Buy
            </button>
          )}
        </div>

        {/* Royalty badge overlay */}
        {listing.hasRoyalty && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-sans font-medium px-2 py-0.5 rounded-full">
              <Gem size={9} />
              {listing.royaltyBps ? `${listing.royaltyBps / 100}% royalty` : "Royalty"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={clsx(isCompact ? "p-1.5" : "p-4")}>
        {/* Collection + Token ID */}
        <div className="flex items-center justify-between mb-0.5">
          <p className={clsx("text-cream-400 font-sans truncate", isCompact ? "text-[8px]" : "text-xs")}>
            {listing.collectionName || shortenAddress(listing.nftAddress)}
          </p>
          <p className={clsx("text-cream-400 font-mono", isCompact ? "text-[8px]" : "text-xs")}>#{listing.tokenId}</p>
        </div>

        {/* Name */}
        <p className={clsx("font-display font-semibold text-cream-900 truncate", isCompact ? "text-[10px] mb-0" : "text-sm mb-1")}>
          {listing.metadata?.name || `Token #${listing.tokenId}`}
        </p>

        {/* Seller - Hide if compact */}
        {!isCompact && (
          <p className="text-xs text-cream-400 font-sans mb-3">
            by {shortenAddress(listing.seller)}
          </p>
        )}

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            {!isCompact && <p className="text-xs text-cream-400 font-sans">Price</p>}
            <p className={clsx("font-display font-bold text-cream-900 leading-tight", isCompact ? "text-[10px]" : "text-lg")}>
              {formatEth(listing.price)} <span className={clsx("font-normal text-cream-500", isCompact ? "text-[8px]" : "text-sm")}>ETH</span>
            </p>
          </div>
          <RoyaltyBadge
            hasRoyalty={!!listing.hasRoyalty}
            royaltyPercent={listing.royaltyBps ? listing.royaltyBps / 100 : undefined}
            showLabel={false}
            size={isCompact ? "xs" : "sm"}
          />
        </div>
      </div>
    </div>
  );
}
