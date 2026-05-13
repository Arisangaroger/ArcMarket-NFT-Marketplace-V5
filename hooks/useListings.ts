"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";
import { parseEther } from "viem";

import { useEffect } from "react";

export function useListing(nftAddress: `0x${string}` | undefined, tokenId: string) {
  const { data, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "listings",
    args: nftAddress && tokenId ? [nftAddress, BigInt(tokenId)] : undefined,
    query: { enabled: !!nftAddress && !!tokenId },
  });

  const listing = data as [string, bigint, boolean] | undefined;
  return {
    seller: listing?.[0] ?? "",
    price: listing?.[1] ?? 0n,
    isListed: listing?.[2] ?? false,
    refetch,
  };
}

export function useListItem(onSuccess?: () => void) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { addNotification, setActiveTx, resetTx } = useMarketStore();

  async function listItem(nftAddress: `0x${string}`, tokenId: string, priceEth: string) {
    try {
      setActiveTx({ status: "pending", message: "Confirm listing in wallet…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "listItem",
        args: [nftAddress, BigInt(tokenId), parseEther(priceEth)],
      });
      setActiveTx({ status: "confirming", message: "Listing your NFT…", txHash: h });
      addNotification({ type: "listing", title: "NFT Listed", message: `NFT #${tokenId} listed for ${priceEth} ETH` });
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

  return { listItem, isPending: isPending || isConfirming, isSuccess };
}

export function useBuyItem(onSuccess?: () => void) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { addNotification, setActiveTx, resetTx } = useMarketStore();

  async function buyItem(nftAddress: `0x${string}`, tokenId: string, price: bigint) {
    try {
      setActiveTx({ status: "pending", message: "Confirm purchase in wallet…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "buyItem",
        args: [nftAddress, BigInt(tokenId)],
        value: price,
      });
      setActiveTx({ status: "confirming", message: "Completing purchase…", txHash: h });
      addNotification({ type: "sale", title: "Purchase Complete", message: `NFT #${tokenId} is now yours!` });
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

  return { buyItem, isPending: isPending || isConfirming, isSuccess };
}

export function useCancelListing(onSuccess?: () => void) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { setActiveTx, resetTx } = useMarketStore();

  async function cancelListing(nftAddress: `0x${string}`, tokenId: string) {
    try {
      setActiveTx({ status: "pending", message: "Confirm cancellation…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "cancelListing",
        args: [nftAddress, BigInt(tokenId)],
      });
      setActiveTx({ status: "confirming", message: "Cancelling listing…", txHash: h });
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

  return { cancelListing, isPending: isPending || isConfirming, isSuccess };
}

export function useUpdateListing(onSuccess?: () => void) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { setActiveTx, resetTx } = useMarketStore();

  async function updateListing(nftAddress: `0x${string}`, tokenId: string, newPriceEth: string) {
    try {
      setActiveTx({ status: "pending", message: "Confirm price update…" });
      const h = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "updateListing",
        args: [nftAddress, BigInt(tokenId), parseEther(newPriceEth)],
      });
      setActiveTx({ status: "confirming", message: "Updating price…", txHash: h });
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

  return { updateListing, isPending: isPending || isConfirming, isSuccess };
}
