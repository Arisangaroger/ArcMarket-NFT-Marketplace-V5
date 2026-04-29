"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ERC721_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";

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

  async function approve() {
    if (!nftAddress) return;
    await writeContractAsync({
      address: nftAddress,
      abi: ERC721_ABI,
      functionName: "setApprovalForAll",
      args: [MARKETPLACE_ADDRESS, true],
    });
  }

  return {
    isApproved: !!isApproved,
    approve,
    isPending: isPending || isConfirming,
    isSuccess,
    refetch,
  };
}
