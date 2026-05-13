import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Collection } from "@/lib/types";
import { formatEth, shortenAddress, resolveIPFS } from "@/lib/constants";
import { Gem, Image as ImageIcon, Layers } from "lucide-react";
import { clsx } from "clsx";

interface CollectionCardProps {
  collection: Collection;
  rank?: number;
}

export function CollectionCard({ collection, rank }: CollectionCardProps) {
  const previews = collection.previewImages || [];
  const hasImages = previews.length > 0;
  
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slideshow
  useEffect(() => {
    if (!hasImages || previews.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % previews.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [hasImages, previews.length]);

  return (
    <Link href={`/collection/${collection.address}`}>
      <div className="group bg-white rounded-2xl border border-cream-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-sky-200 transition-all duration-300 flex flex-col h-full">
        {/* ── Slideshow Section ── */}
        <div className="relative aspect-[16/10] bg-cream-50 overflow-hidden border-b border-cream-100">
          {hasImages ? (
            <div className="relative w-full h-full">
              {previews.map((img, idx) => (
                <div
                  key={img + idx}
                  className={clsx(
                    "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                    idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                >
                  <Image
                    src={resolveIPFS(img)}
                    alt={`${collection.name} preview ${idx}`}
                    fill
                    className={clsx(
                      "object-cover transition-transform duration-[4000ms] ease-linear",
                      idx === currentIndex ? "scale-110" : "scale-100"
                    )}
                    unoptimized
                  />
                </div>
              ))}
              
              {/* Progress Indicators */}
              {previews.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {previews.map((_, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        "h-1 rounded-full transition-all duration-500",
                        idx === currentIndex 
                          ? "w-4 bg-white shadow-sm" 
                          : "w-1 bg-white/40"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Geometric fallback */
            <div className="w-full h-full bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-inner flex items-center justify-center text-sky-500 font-display font-bold text-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  {collection.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-violet-500 shadow-lg flex items-center justify-center text-white text-[10px] font-bold -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  NFT
                </div>
              </div>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex gap-2">
            {rank && (
              <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-display font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                #{rank}
              </span>
            )}
            <span className="bg-white/90 backdrop-blur-md text-cream-900 text-[10px] font-display font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-cream-100">
              <Layers size={10} className="text-sky-500" />
              {collection.symbol}
            </span>
          </div>

          {collection.hasRoyalty && (
            <div className="absolute top-3 right-3 bg-violet-500/90 backdrop-blur-md text-white text-[10px] font-display font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
              <Gem size={10} />
              {collection.royaltyBps / 100}%
            </div>
          )}
          
          {/* Bottom Fade */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* ── Content Section ── */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-display font-bold text-cream-900 group-hover:text-sky-600 transition-colors truncate">
              {collection.name}
            </h3>
          </div>
          
          <p className="text-xs text-cream-400 font-sans mb-4 flex items-center gap-1">
            <span className="font-medium text-cream-500">{collection.symbol}</span>
            <span>·</span>
            <span>by {shortenAddress(collection.creatorAddress)}</span>
          </p>

          <div className="mt-auto grid grid-cols-2 gap-3">
            <div className="bg-cream-50 rounded-xl p-2 border border-cream-100/50">
              <p className="text-[10px] text-cream-400 uppercase tracking-wider font-bold mb-0.5">Floor</p>
              <p className="text-sm font-display font-bold text-cream-800">
                {formatEth(collection.floorPrice, 3)} <span className="text-[10px] font-normal opacity-60">ETH</span>
              </p>
            </div>
            <div className="bg-cream-50 rounded-xl p-2 border border-cream-100/50">
              <p className="text-[10px] text-cream-400 uppercase tracking-wider font-bold mb-0.5">Volume</p>
              <p className="text-sm font-display font-bold text-cream-800">
                {formatEth(collection.totalVolume, 1)} <span className="text-[10px] font-normal opacity-60">ETH</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
