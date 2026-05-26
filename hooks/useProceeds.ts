"use client";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";
import { useEffect } from "react";

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
