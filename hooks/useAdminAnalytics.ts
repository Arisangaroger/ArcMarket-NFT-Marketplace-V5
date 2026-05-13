"use client";
import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";

export interface SaleEvent {
  nftAddress: `0x${string}`;
  tokenId: string;
  price: bigint;
  buyer: `0x${string}`;
  timestamp: number;
  txHash: string;
}

export function useAdminAnalytics() {
  const [stats, setStats] = useState({
    totalVolume: 0n,
    totalSales: 0,
    activeListings: 0,
    totalListings: 0,
    totalRoyalties: 0n, // Estimated or read if possible
  });
  const [recentSales, setRecentSales] = useState<SaleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchAnalytics = useCallback(async () => {
    if (!publicClient) return;
    setIsLoading(true);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - 100000n; // Scan last ~100k blocks

      const [listedLogs, boughtLogs, cancelledLogs] = await Promise.all([
        publicClient.getContractEvents({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          eventName: "ItemListed",
          fromBlock,
        }),
        publicClient.getContractEvents({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          eventName: "ItemBought",
          fromBlock,
        }),
        publicClient.getContractEvents({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          eventName: "ItemCancelled",
          fromBlock,
        }),
      ]);

      // 1. Calculate Stats
      let totalVol = 0n;
      boughtLogs.forEach((log) => {
        const { price } = log.args as any;
        totalVol += price;
      });

      const activeListingsCount = listedLogs.length - boughtLogs.length - cancelledLogs.length;

      setStats({
        totalVolume: totalVol,
        totalSales: boughtLogs.length,
        activeListings: Math.max(0, activeListingsCount),
        totalListings: listedLogs.length,
        totalRoyalties: (totalVol * 5n) / 100n, // Placeholder: 5% estimate if not read directly
      });

      // 2. Format Recent Sales
      const formattedSales = await Promise.all(
        boughtLogs.slice(-10).reverse().map(async (log) => {
          const { nftAddress, tokenId, price, buyer } = log.args as any;
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          return {
            nftAddress,
            tokenId: tokenId.toString(),
            price,
            buyer,
            timestamp: Number(block.timestamp),
            txHash: log.transactionHash,
          };
        })
      );

      setRecentSales(formattedSales);
    } catch (e) {
      console.error("Error fetching admin analytics:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { stats, recentSales, isLoading, refetch: fetchAnalytics };
}
