"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS, ERC721_ABI, resolveIPFS } from "@/lib/constants";
import { NFTListing, NFTMetadata } from "@/lib/types";
import { COLLECTION_ADDRESSES } from "@/lib/collections-config";

export function useMarketplaceState() {
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const publicClient = usePublicClient();

  const fetchState = useCallback(async () => {
    if (!publicClient) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch all relevant events from the marketplace
      // For production, you'd want to limit the block range or use a subgraph
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - 50000n; // Scan last ~50k blocks

      const [listedLogs, boughtLogs, cancelledLogs, updatedLogs] = await Promise.all([
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
        publicClient.getContractEvents({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          eventName: "ItemUpdated",
          fromBlock,
        }),
      ]);

      // 2. Reconstruct active listings
      // Map key: nftAddress-tokenId
      const activeListingsMap = new Map<string, NFTListing>();

      // Process listed items
      listedLogs.forEach((log) => {
        const { seller, nftAddress, tokenId, price } = log.args as any;
        const key = `${nftAddress.toLowerCase()}-${tokenId.toString()}`;
        activeListingsMap.set(key, {
          nftAddress,
          tokenId: tokenId.toString(),
          seller,
          price,
        });
      });

      // Process updates
      updatedLogs.forEach((log) => {
        const { nftAddress, tokenId, newPrice } = log.args as any;
        const key = `${nftAddress.toLowerCase()}-${tokenId.toString()}`;
        if (activeListingsMap.has(key)) {
          activeListingsMap.get(key)!.price = newPrice;
        }
      });

      // Process cancellations
      cancelledLogs.forEach((log) => {
        const { nftAddress, tokenId } = log.args as any;
        const key = `${nftAddress.toLowerCase()}-${tokenId.toString()}`;
        activeListingsMap.delete(key);
      });

      // Process buys
      boughtLogs.forEach((log) => {
        const { nftAddress, tokenId } = log.args as any;
        const key = `${nftAddress.toLowerCase()}-${tokenId.toString()}`;
        activeListingsMap.delete(key);
      });

      const activeListings = Array.from(activeListingsMap.values());

      // 3. Fetch Metadata and Collection Info for each active listing
      const enrichedListings = await Promise.all(
        activeListings.map(async (listing) => {
          try {
            // Fetch tokenURI
            const tokenURI = (await publicClient.readContract({
              address: listing.nftAddress as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "tokenURI",
              args: [BigInt(listing.tokenId)],
            })) as string;

            // Fetch name and symbol of the collection
            const [name, symbol] = (await Promise.all([
              publicClient.readContract({
                address: listing.nftAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: "name",
              }),
              publicClient.readContract({
                address: listing.nftAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: "symbol",
              }),
            ])) as [string, string];

            // Resolve metadata
            const metadataUrl = resolveIPFS(tokenURI);
            let metadata: NFTMetadata = {
              name: `${name} #${listing.tokenId}`,
              description: "",
              image: "/placeholder-nft.svg",
            };

            try {
              const controller = new AbortController();
              const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

              const res = await fetch(metadataUrl, { signal: controller.signal });
              clearTimeout(id);
              
              if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
              
              const data = await res.json();
              metadata = {
                name: data.name || metadata.name,
                description: data.description || "",
                image: resolveIPFS(data.image || ""),
                attributes: data.attributes,
              };
            } catch (e) {
              console.warn(`Error fetching metadata for ${listing.nftAddress} #${listing.tokenId}:`, e);
              // Keep default metadata but maybe mark it as failed to load
            }

            return {
              ...listing,
              collectionName: name,
              collectionSymbol: symbol,
              metadata,
            };
          } catch (e) {
            console.error(`Error enriching listing ${listing.nftAddress} #${listing.tokenId}:`, e);
            return listing;
          }
        })
      );

      setListings(enrichedListings);
    } catch (e) {
      console.error("Error fetching marketplace state:", e);
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return { listings, isLoading, error, refetch: fetchState };
}
