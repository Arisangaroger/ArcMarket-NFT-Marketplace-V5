"use client";
import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ERC721_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";

export function useApproval(
  nftAddress: `0x${string}` | undefined,
  ownerAddress: `0x${string}` | undefined
) {
  const { data: isApproved, refetch } = useReadContract({
    address: nftAddress,
    abi: ERC721_ABI,
    functionName: "isApprovedForAll",
    args: ownerAddress ? [ownerAddress, MARKETPLACE_ADDRESS] : undefined,
    query: { enabled: !!nftAddress && !!ownerAddress },
  });

  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [forceApproved, setForceApproved] = useState(false);
  const { setActiveTx, resetTx } = useMarketStore();

  // Auto-refetch when approval is successful
  useEffect(() => {
    if (isSuccess) {
      setForceApproved(true);
      setActiveTx({ status: "success", message: "Marketplace approved!" });
      refetch();
      setTimeout(resetTx, 5000);
    }
  }, [isSuccess, refetch, setActiveTx, resetTx]);

  async function approve() {
    if (!nftAddress) return;
    try {
      setActiveTx({ status: "pending", message: "Confirm approval in wallet…" });
      const h = await writeContractAsync({
        address: nftAddress,
        abi: ERC721_ABI,
        functionName: "setApprovalForAll",
        args: [MARKETPLACE_ADDRESS, true],
      });
      setActiveTx({ status: "confirming", message: "Approving marketplace…", txHash: h });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Approval failed";
      setActiveTx({ status: "error", message: msg });
      setTimeout(resetTx, 3000);
    }
  }

  return {
    isApproved: !!isApproved || forceApproved,
    approve,
    isPending: isPending || isConfirming,
    isSuccess,
    refetch,
  };
}
