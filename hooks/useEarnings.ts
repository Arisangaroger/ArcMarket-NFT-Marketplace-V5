"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";

export function useEarnings() {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { setActiveTx, resetTx } = useMarketStore();

  // 1. Read Balances
  // ... (rest of the read logic)
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
      setActiveTx({ status: "success", message: "Withdrawal successful!" });
      refetchProceeds();
      refetchRoyalties();
      refetchFees();
      setWithdrawType(null);
      setTimeout(resetTx, 5000);
    }
  }, [isSuccess, refetchProceeds, refetchRoyalties, refetchFees, setActiveTx, resetTx]);

  async function withdrawProceeds() {
    try {
      setWithdrawType("proceeds");
      setActiveTx({ status: "pending", message: "Confirm withdrawal in wallet…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "withdrawProceeds",
      });
      setActiveTx({ status: "confirming", message: "Withdrawing proceeds…", txHash: h });
    } catch (e) {
      setActiveTx({ status: "error", message: "Withdrawal failed" });
      setTimeout(resetTx, 3000);
      setWithdrawType(null);
    }
  }

  async function withdrawRoyalties() {
    try {
      setWithdrawType("royalties");
      setActiveTx({ status: "pending", message: "Confirm withdrawal in wallet…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "withdrawRoyalties",
      });
      setActiveTx({ status: "confirming", message: "Withdrawing royalties…", txHash: h });
    } catch (e) {
      setActiveTx({ status: "error", message: "Withdrawal failed" });
      setTimeout(resetTx, 3000);
      setWithdrawType(null);
    }
  }

  async function withdrawMarketplaceFees() {
    try {
      setWithdrawType("fees");
      setActiveTx({ status: "pending", message: "Confirm withdrawal in wallet…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "withdrawMarketplaceFees",
      });
      setActiveTx({ status: "confirming", message: "Withdrawing admin fees…", txHash: h });
    } catch (e) {
      setActiveTx({ status: "error", message: "Withdrawal failed" });
      setTimeout(resetTx, 3000);
      setWithdrawType(null);
    }
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
