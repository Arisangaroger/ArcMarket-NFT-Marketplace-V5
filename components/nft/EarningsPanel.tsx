"use client";
import { useAccount } from "wagmi";
import { formatEth } from "@/lib/constants";
import { useProceeds, useWithdrawProceeds, useWithdrawRoyalties } from "@/hooks/useProceeds";
import { useRoyaltyProceeds } from "@/hooks/useRoyalties";
import { Button } from "@/components/ui/Button";
import { DollarSign, Gem, ArrowDownToLine } from "lucide-react";

export function EarningsPanel() {
  const { address } = useAccount();
  const { proceeds, refetch: refetchProceeds } = useProceeds(address);
  const { royaltyProceeds, refetch: refetchRoyalties } = useRoyaltyProceeds(address);
  const { withdraw: withdrawSales, isPending: salesPending } = useWithdrawProceeds(refetchProceeds);
  const { withdraw: withdrawRoyalties, isPending: royaltiesPending } = useWithdrawRoyalties(refetchRoyalties);

  const hasProceeds = proceeds > 0n;
  const hasRoyalties = royaltyProceeds > 0n;

  async function handleWithdrawSales() {
    await withdrawSales();
  }

  async function handleWithdrawRoyalties() {
    await withdrawRoyalties();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Seller Earnings — Sky/Blue */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
            <DollarSign size={16} className="text-sky-600" />
          </div>
          <div>
            <p className="text-xs font-display font-semibold text-sky-500 uppercase tracking-wide">
              Sale Earnings
            </p>
          </div>
        </div>

        <p className="text-3xl font-display font-bold text-sky-800 mt-3 mb-1">
          {formatEth(proceeds, 4)}
          <span className="text-base font-normal text-sky-500 ml-1">ETH</span>
        </p>
        <p className="text-xs text-sky-400 font-sans mb-4">
          From completed sales on marketplace
        </p>

        <Button
          variant="primary"
          size="sm"
          loading={salesPending}
          disabled={!hasProceeds || salesPending}
          onClick={handleWithdrawSales}
          className="w-full bg-sky-500 hover:bg-sky-600"
        >
          <ArrowDownToLine size={13} />
          {hasProceeds ? "Withdraw Earnings" : "No earnings yet"}
        </Button>
      </div>

      {/* Creator Royalties — Violet/Purple */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Gem size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-display font-semibold text-violet-500 uppercase tracking-wide">
              Creator Royalties
            </p>
          </div>
        </div>

        <p className="text-3xl font-display font-bold text-violet-800 mt-3 mb-1">
          {formatEth(royaltyProceeds, 4)}
          <span className="text-base font-normal text-violet-400 ml-1">ETH</span>
        </p>
        <p className="text-xs text-violet-400 font-sans mb-4">
          ERC-2981 royalties from secondary sales
        </p>

        <Button
          variant="violet"
          size="sm"
          loading={royaltiesPending}
          disabled={!hasRoyalties || royaltiesPending}
          onClick={handleWithdrawRoyalties}
          className="w-full"
        >
          <ArrowDownToLine size={13} />
          {hasRoyalties ? "Withdraw Royalties" : "No royalties yet"}
        </Button>
      </div>
    </div>
  );
}
