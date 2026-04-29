"use client";
import { formatEth, calcBreakdown, PLATFORM_FEE_BPS } from "@/lib/constants";
import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";

interface PriceBreakdownProps {
  priceWei: bigint;
  royaltyBps: number;
  compact?: boolean;
  className?: string;
}

export function PriceBreakdown({
  priceWei,
  royaltyBps,
  compact = false,
  className,
}: PriceBreakdownProps) {
  const breakdown = calcBreakdown(priceWei, royaltyBps, PLATFORM_FEE_BPS);
  const hasRoyalty = royaltyBps > 0;

  if (compact) {
    return (
      <div className={clsx("text-xs text-cream-500 space-y-0.5 font-sans", className)}>
        <div className="flex justify-between gap-4">
          <span>Seller</span>
          <span className="text-cream-700">{formatEth(breakdown.sellerReceives)} ETH</span>
        </div>
        {hasRoyalty && (
          <div className="flex justify-between gap-4">
            <span>Creator royalty</span>
            <span className="text-violet-600">{formatEth(breakdown.royaltyAmount)} ETH</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span>Platform fee</span>
          <span className="text-cream-600">{formatEth(breakdown.platformFee)} ETH</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("rounded-xl border border-cream-200 overflow-hidden font-sans", className)}>
      {/* Header */}
      <div className="bg-cream-50 px-4 py-3 border-b border-cream-100">
        <p className="text-xs font-display font-semibold text-cream-500 uppercase tracking-wider">
          Value Breakdown
        </p>
        <p className="text-2xl font-display font-bold text-cream-900 mt-0.5">
          {formatEth(breakdown.total)} ETH
        </p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-cream-100">
        {/* Seller */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <div>
              <p className="text-sm font-medium text-cream-800">Seller receives</p>
              <p className="text-xs text-cream-400">
                {100 - royaltyBps / 100 - PLATFORM_FEE_BPS / 100}% of sale
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-sky-600">{formatEth(breakdown.sellerReceives)} ETH</p>
          </div>
        </div>

        {/* Creator Royalty */}
        {hasRoyalty ? (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
              <div>
                <p className="text-sm font-medium text-cream-800">Creator royalty</p>
                <p className="text-xs text-cream-400">{royaltyBps / 100}% ERC-2981</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-violet-600">{formatEth(breakdown.royaltyAmount)} ETH</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 opacity-50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cream-300" />
              <div>
                <p className="text-sm text-cream-500">No creator royalty</p>
                <p className="text-xs text-cream-400">Contract does not support ERC-2981</p>
              </div>
            </div>
            <p className="text-sm text-cream-400">—</p>
          </div>
        )}

        {/* Platform Fee */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div>
              <p className="text-sm font-medium text-cream-800">Platform fee</p>
              <p className="text-xs text-cream-400">{PLATFORM_FEE_BPS / 100}% marketplace</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-amber-600">{formatEth(breakdown.platformFee)} ETH</p>
          </div>
        </div>
      </div>

      {/* Visual bar */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div
            className="bg-sky-400 rounded-l-full"
            style={{ width: `${(Number(breakdown.sellerReceives) / Number(breakdown.total)) * 100}%` }}
          />
          {hasRoyalty && (
            <div
              className="bg-violet-400"
              style={{ width: `${royaltyBps / 100}%` }}
            />
          )}
          <div
            className="bg-amber-400 rounded-r-full"
            style={{ width: `${PLATFORM_FEE_BPS / 100}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-cream-400">
            <span className="inline-block w-2 h-2 rounded-full bg-sky-400" /> Seller
          </span>
          {hasRoyalty && (
            <span className="flex items-center gap-1 text-xs text-cream-400">
              <span className="inline-block w-2 h-2 rounded-full bg-violet-400" /> Creator
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-cream-400">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> Platform
          </span>
        </div>
      </div>
    </div>
  );
}
