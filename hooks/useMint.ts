"use client";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { COLLECTION_ABI } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";
import { toast } from "sonner";
import { useEffect } from "react";

export function useMint(onSuccess?: () => void) {
  const { data: hash, error, isPending, writeContractAsync } = useWriteContract();
  const { setActiveTx, resetTx, addNotification } = useMarketStore();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  async function mint(address: `0x${string}`, priceWei: bigint) {
    try {
      setActiveTx({ status: "pending", message: "Confirm minting in wallet…" });
      
      const h = await writeContractAsync({
        address,
        abi: COLLECTION_ABI,
        functionName: "mintNFT",
        value: priceWei,
      });

      setActiveTx({ status: "confirming", message: "Minting your NFT…", txHash: h });
      
    } catch (err: any) {
      console.error("Minting failed:", err);
      const msg = err.message || "Minting failed";
      setActiveTx({ status: "error", message: msg });
      toast.error(msg);
      setTimeout(resetTx, 3000);
    }
  }

  useEffect(() => {
    if (isSuccess) {
      // Avoid infinite loop by only updating if status is not already success
      setActiveTx({ status: "success", message: "NFT minted successfully!" });
      addNotification({ 
        type: "info", 
        title: "NFT Minted", 
        message: "You successfully minted a new NFT!" 
      });
      toast.success("NFT minted successfully!");
      if (onSuccess) onSuccess();
      setTimeout(resetTx, 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  };
}
