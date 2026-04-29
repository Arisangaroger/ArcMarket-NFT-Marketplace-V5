import Link from "next/link";
import { Collection } from "@/lib/types";
import { formatEth, shortenAddress } from "@/lib/constants";
import { Gem, TrendingUp, Image as ImageIcon } from "lucide-react";
import { clsx } from "clsx";

interface CollectionCardProps {
  collection: Collection;
  rank?: number;
}

export function CollectionCard({ collection, rank }: CollectionCardProps) {
  return (
    <Link href={`/collection/${collection.address}`}>
      <div className="group bg-white rounded-2xl border border-cream-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 hover:border-cream-300 transition-all duration-200">
        {/* Banner / color band */}
        <div
          className={clsx(
            "h-14 relative flex items-end px-4 pb-2",
            collection.hasRoyalty ? "bg-gradient-to-br from-violet-50 to-sky-50" : "bg-gradient-to-br from-cream-100 to-cream-200"
          )}
        >
          {rank && (
            <span className="absolute top-2 left-3 text-xs font-display font-bold text-cream-400">
              #{rank}
            </span>
          )}
          {collection.hasRoyalty && (
            <span className="absolute top-2 right-3 inline-flex items-center gap-1 bg-violet-100 text-violet-600 text-xs font-sans px-2 py-0.5 rounded-full">
              <Gem size={9} />
              {collection.royaltyBps / 100}% royalty
            </span>
          )}
          {/* Collection avatar */}
          <div className="absolute -bottom-5 left-4 w-10 h-10 rounded-xl bg-white border-2 border-cream-200 flex items-center justify-center shadow-sm text-cream-400">
            <ImageIcon size={18} />
          </div>
        </div>

        <div className="pt-7 px-4 pb-4">
          <h3 className="text-sm font-display font-bold text-cream-900 truncate">{collection.name}</h3>
          <p className="text-xs text-cream-400 font-sans mb-3">{collection.symbol} · by {shortenAddress(collection.creatorAddress)}</p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-cream-50 rounded-xl p-2">
              <p className="text-xs text-cream-400 mb-0.5">Floor</p>
              <p className="text-xs font-display font-semibold text-cream-800">
                {formatEth(collection.floorPrice, 3)} ETH
              </p>
            </div>
            <div className="bg-cream-50 rounded-xl p-2">
              <p className="text-xs text-cream-400 mb-0.5">Volume</p>
              <p className="text-xs font-display font-semibold text-cream-800">
                {formatEth(collection.totalVolume, 2)} ETH
              </p>
            </div>
            {collection.hasRoyalty ? (
              <div className="bg-violet-50 rounded-xl p-2">
                <p className="text-xs text-violet-400 mb-0.5">Royalties</p>
                <p className="text-xs font-display font-semibold text-violet-700">
                  {formatEth(collection.totalRoyaltiesPaid, 2)} ETH
                </p>
              </div>
            ) : (
              <div className="bg-cream-50 rounded-xl p-2">
                <p className="text-xs text-cream-400 mb-0.5">Listed</p>
                <p className="text-xs font-display font-semibold text-cream-800">
                  {collection.listedCount}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
