"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";

export function useEarnings() {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();

  // 1. Read Balances
  const { data: proceeds, refetch: refetchProceeds } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "proceeds",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: royalties, refetch: refetchRoyalties } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "royalties",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: marketplaceBalance, refetch: refetchFees } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "marketplaceBalance",
  });

  const { data: owner } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "owner",
  });

  // 2. Withdrawal Actions
  const { writeContractAsync, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [withdrawType, setWithdrawType] = useState<"proceeds" | "royalties" | "fees" | null>(null);

  useEffect(() => {
    if (isSuccess) {
      refetchProceeds();
      refetchRoyalties();
      refetchFees();
      setWithdrawType(null);
    }
  }, [isSuccess, refetchProceeds, refetchRoyalties, refetchFees]);

  async function withdrawProceeds() {
    setWithdrawType("proceeds");
    await writeContractAsync({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "withdrawProceeds",
    });
  }

  async function withdrawRoyalties() {
    setWithdrawType("royalties");
    await writeContractAsync({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "withdrawRoyalties",
    });
  }

  async function withdrawMarketplaceFees() {
    setWithdrawType("fees");
    await writeContractAsync({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "withdrawMarketplaceFees",
    });
  }

  return {
    balances: {
      proceeds: (proceeds as bigint) || 0n,
      royalties: (royalties as bigint) || 0n,
      fees: (marketplaceBalance as bigint) || 0n,
    },
    isOwner: userAddress && owner && (owner as string).toLowerCase() === userAddress.toLowerCase(),
    actions: {
      withdrawProceeds,
      withdrawRoyalties,
      withdrawMarketplaceFees,
    },
    isWithdrawing: isConfirming,
    withdrawType,
    isSuccess,
  };
}
