"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";

import { useEffect } from "react";

export function useProceeds(address: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "proceeds",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  return { proceeds: (data as bigint | undefined) ?? 0n, refetch };
}

export function useWithdrawProceeds(onSuccess?: () => void) {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { addNotification, setActiveTx, resetTx } = useMarketStore();

  async function withdraw() {
    try {
      setActiveTx({ status: "pending", message: "Confirm withdrawal in wallet…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "withdrawProceeds",
      });
      setActiveTx({ status: "confirming", message: "Confirming transaction…", txHash: h });
      addNotification({ type: "sale", title: "Withdrawal Sent", message: "Your sale proceeds are on their way.", txHash: h });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      setActiveTx({ status: "error", message: msg });
      setTimeout(resetTx, 3000);
    }
  }

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return { withdraw, isPending: isPending || isConfirming, isSuccess };
}

export function useWithdrawRoyalties(onSuccess?: () => void) {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { addNotification, setActiveTx, resetTx } = useMarketStore();

  async function withdraw() {
    try {
      setActiveTx({ status: "pending", message: "Confirm royalty withdrawal in wallet…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "withdrawRoyalties",
      });
      setActiveTx({ status: "confirming", message: "Confirming…", txHash: h });
      addNotification({ type: "royalty", title: "Royalties Withdrawn", message: "Your creator royalties have been sent.", txHash: h });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      setActiveTx({ status: "error", message: msg });
      setTimeout(resetTx, 3000);
    }
  }

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return { withdraw, isPending: isPending || isConfirming, isSuccess };
}

export function useWithdrawPlatformFees(onSuccess?: () => void) {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { setActiveTx, resetTx } = useMarketStore();

  async function withdraw() {
    try {
      setActiveTx({ status: "pending", message: "Confirm platform fee withdrawal…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "withdrawMarketplaceFees",
      });
      setActiveTx({ status: "confirming", message: "Confirming…", txHash: h });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      setActiveTx({ status: "error", message: msg });
      setTimeout(resetTx, 3000);
    }
  }

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return { withdraw, isPending: isPending || isConfirming, isSuccess };
}
