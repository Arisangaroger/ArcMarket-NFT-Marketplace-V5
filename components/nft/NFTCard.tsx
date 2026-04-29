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
}

export function NFTCard({ listing, onQuickBuy }: NFTCardProps) {
  const [hovered, setHovered] = useState(false);
  const imageUrl = resolveIPFS(listing.metadata?.image || "");

  return (
    <div
      className="group relative bg-white rounded-2xl border border-cream-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-cream-300"
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
      <div className="p-4">
        {/* Collection + Token ID */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-cream-400 font-sans truncate">
            {listing.collectionName || shortenAddress(listing.nftAddress)}
          </p>
          <p className="text-xs text-cream-400 font-mono">#{listing.tokenId}</p>
        </div>

        {/* Name */}
        <p className="text-sm font-display font-semibold text-cream-900 truncate mb-1">
          {listing.metadata?.name || `Token #${listing.tokenId}`}
        </p>

        {/* Seller */}
        <p className="text-xs text-cream-400 font-sans mb-3">
          by {shortenAddress(listing.seller)}
        </p>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-cream-400 font-sans">Price</p>
            <p className="text-lg font-display font-bold text-cream-900 leading-tight">
              {formatEth(listing.price)} <span className="text-sm font-normal text-cream-500">ETH</span>
            </p>
          </div>
          <RoyaltyBadge
            hasRoyalty={!!listing.hasRoyalty}
            royaltyPercent={listing.royaltyBps ? listing.royaltyBps / 100 : undefined}
            showLabel={false}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
