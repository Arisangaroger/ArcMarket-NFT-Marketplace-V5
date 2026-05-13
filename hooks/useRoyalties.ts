"use client";
import { useReadContract } from "wagmi";
import { ERC2981_ABI, MARKETPLACE_ABI, MARKETPLACE_ADDRESS, bpsToPercent } from "@/lib/constants";
import { parseEther } from "viem";

export function useRoyaltyInfo(nftAddress: `0x${string}` | undefined, tokenId: string) {
  const samplePrice = parseEther("1");

  const { data, isError } = useReadContract({
    address: nftAddress,
    abi: ERC2981_ABI,
    functionName: "royaltyInfo",
    args: tokenId ? [BigInt(tokenId), samplePrice] : undefined,
    query: { enabled: !!nftAddress && !!tokenId, retry: 1 },
  });

  // ERC2981 may not be supported — treat error as no royalty
  const royaltyReceiver = isError ? undefined : (data?.[0] as `0x${string}` | undefined);
  const royaltyAmountPerEth = isError ? 0n : (data?.[1] ?? 0n);
  const royaltyBps = Number(royaltyAmountPerEth) / 1e14; // amount/1e18 * 10000
  const hasRoyalty = !isError && royaltyBps > 0;

  return {
    royaltyReceiver,
    royaltyBps: Math.round(royaltyBps),
    royaltyPercent: bpsToPercent(Math.round(royaltyBps)),
    hasRoyalty,
  };
}

export function useRoyaltyProceeds(address: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "royalties",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  return { royaltyProceeds: (data as bigint | undefined) ?? 0n, refetch };
}
