"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS, ERC721_ABI, COLLECTION_ABI, resolveIPFS } from "@/lib/constants";
import { NFTListing, NFTMetadata } from "@/lib/types";
import { COLLECTION_ADDRESSES } from "@/lib/collections-config";
import { parseEther } from "viem";

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
      const currentBlock = await publicClient.getBlockNumber();
      // Scan a larger range for better reliability, or from a known start block
      const fromBlock = currentBlock > 500000n ? currentBlock - 500000n : 0n;

      const [listedLogs, boughtLogs, cancelledLogs, updatedLogs] = await Promise.all([
        publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemListed", fromBlock }),
        publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemBought", fromBlock }),
        publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemCancelled", fromBlock }),
        publicClient.getContractEvents({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, eventName: "ItemUpdated", fromBlock }),
      ]);

      // Combine and sort events chronologically to reconstruct state correctly
      const allEvents = [
        ...listedLogs.map(l => ({ ...l, type: 'listed' })),
        ...boughtLogs.map(l => ({ ...l, type: 'bought' })),
        ...cancelledLogs.map(l => ({ ...l, type: 'cancelled' })),
        ...updatedLogs.map(l => ({ ...l, type: 'updated' })),
      ].sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) return Number(a.blockNumber - b.blockNumber);
        return (a.logIndex || 0) - (b.logIndex || 0);
      });

      const activeListingsMap = new Map<string, NFTListing>();

      allEvents.forEach((event) => {
        const { nftAddress, tokenId } = event.args as any;
        const key = `${nftAddress.toLowerCase()}-${tokenId.toString()}`;

        switch (event.type) {
          case 'listed':
            activeListingsMap.set(key, {
              nftAddress,
              tokenId: tokenId.toString(),
              seller: (event.args as any).seller,
              price: (event.args as any).price,
            });
            break;
          case 'updated':
            if (activeListingsMap.has(key)) {
              activeListingsMap.get(key)!.price = (event.args as any).newPrice;
            }
            break;
          case 'cancelled':
          case 'bought':
            activeListingsMap.delete(key);
            break;
        }
      });

      const activeListings = Array.from(activeListingsMap.values());

      // 3. Fetch Metadata, Collection Info, and Royalties for each active listing
      const enrichedListings = await Promise.all(
        activeListings.map(async (listing) => {
          try {
            const nftAddress = listing.nftAddress as `0x${string}`;
            const tokenId = BigInt(listing.tokenId);

            // Double check isActive in contract to be 100% sure
            const contractListing = await publicClient.readContract({
              address: MARKETPLACE_ADDRESS,
              abi: MARKETPLACE_ABI,
              functionName: "listings",
              args: [nftAddress, tokenId],
            }) as [string, bigint, boolean];

            if (!contractListing[2]) return null; // Not active

            // Fetch tokenURI, name, symbol
            const [tokenURI, name, symbol] = await Promise.all([
              publicClient.readContract({ address: nftAddress, abi: ERC721_ABI, functionName: "tokenURI", args: [tokenId] }),
              publicClient.readContract({ address: nftAddress, abi: ERC721_ABI, functionName: "name" }).catch(() => "Unknown"),
              publicClient.readContract({ address: nftAddress, abi: ERC721_ABI, functionName: "symbol" }).catch(() => ""),
            ]) as [string, string, string];

            // Fetch Royalty Info (ERC2981)
            let royaltyBps = 0;
            let hasRoyalty = false;
            try {
              const [receiver, amount] = await publicClient.readContract({
                address: nftAddress,
                abi: [
                  {
                    name: "royaltyInfo",
                    type: "function",
                    stateMutability: "view",
                    inputs: [{ type: "uint256" }, { type: "uint256" }],
                    outputs: [{ type: "address" }, { type: "uint256" }],
                  },
                ],
                functionName: "royaltyInfo",
                args: [tokenId, parseEther("1")], // Use 1 ETH to get BPS
              }) as [string, bigint];
              
              if (amount > 0n) {
                royaltyBps = Number((amount * 10000n) / parseEther("1"));
                hasRoyalty = true;
              }
            } catch (e) {
              // No royalty support
            }

            // Resolve metadata
            const metadataUrl = resolveIPFS(tokenURI);
            let metadata: NFTMetadata = {
              name: `${name} #${listing.tokenId}`,
              description: "",
              image: "/placeholder-nft.svg",
            };

            try {
              const res = await fetch(metadataUrl);
              if (res.ok) {
                const data = await res.json();
                metadata = {
                  name: data.name || metadata.name,
                  description: data.description || "",
                  image: resolveIPFS(data.image || ""),
                  attributes: data.attributes,
                };
              }
            } catch (e) {}

            return {
              ...listing,
              collectionName: name,
              collectionSymbol: symbol,
              metadata,
              royaltyBps,
              hasRoyalty,
            };
          } catch (e) {
            console.error(`Error enriching listing ${listing.nftAddress} #${listing.tokenId}:`, e);
            return listing;
          }
        })
      );

      setListings(enrichedListings.filter(Boolean) as NFTListing[]);
    } catch (e) {
      console.warn("Event fetching failed (possibly due to Alchemy RPC block range limits). Falling back to direct collection scanning...", e);
      try {
        const scannedListings: NFTListing[] = [];

        for (const colAddress of COLLECTION_ADDRESSES) {
          try {
            const [name, symbol, totalSupplyRaw] = await Promise.all([
              publicClient.readContract({ address: colAddress, abi: COLLECTION_ABI, functionName: "name" }).catch(() => "Unknown"),
              publicClient.readContract({ address: colAddress, abi: COLLECTION_ABI, functionName: "symbol" }).catch(() => ""),
              publicClient.readContract({ address: colAddress, abi: COLLECTION_ABI, functionName: "totalSupply" }).catch(() => 0n),
            ]) as [string, string, bigint];

            const totalSupply = Number(totalSupplyRaw);
            const maxToScan = totalSupply > 0 ? totalSupply : 20;

            const promises = [];
            for (let i = 1; i <= maxToScan; i++) {
              promises.push(
                publicClient.readContract({
                  address: MARKETPLACE_ADDRESS,
                  abi: MARKETPLACE_ABI,
                  functionName: "listings",
                  args: [colAddress, BigInt(i)],
                }).then(res => ({ tokenId: i, res }))
                  .catch(() => null)
              );
            }

            const results = await Promise.all(promises);
            for (const item of results) {
              if (item && item.res && item.res[2]) { // isActive
                const [seller, price] = item.res as [string, bigint, boolean];
                scannedListings.push({
                  nftAddress: colAddress,
                  tokenId: item.tokenId.toString(),
                  seller,
                  price,
                  collectionName: name,
                  collectionSymbol: symbol
                });
              }
            }
          } catch (colErr) {
            console.error(`Error scanning collection ${colAddress} in fallback:`, colErr);
          }
        }

        // Enrich the fallback listings with metadata & royalty info
        const enrichedScannedListings = await Promise.all(
          scannedListings.map(async (listing) => {
            try {
              const nftAddress = listing.nftAddress as `0x${string}`;
              const tokenId = BigInt(listing.tokenId);

              // Fetch tokenURI
              const tokenURI = await publicClient.readContract({
                address: nftAddress,
                abi: ERC721_ABI,
                functionName: "tokenURI",
                args: [tokenId],
              }) as string;

              // Fetch Royalty Info (ERC2981)
              let royaltyBps = 0;
              let hasRoyalty = false;
              try {
                const [receiver, amount] = await publicClient.readContract({
                  address: nftAddress,
                  abi: [
                    {
                      name: "royaltyInfo",
                      type: "function",
                      stateMutability: "view",
                      inputs: [{ type: "uint256" }, { type: "uint256" }],
                      outputs: [{ type: "address" }, { type: "uint256" }],
                    },
                  ],
                  functionName: "royaltyInfo",
                  args: [tokenId, parseEther("1")],
                }) as [string, bigint];

                if (amount > 0n) {
                  royaltyBps = Number((amount * 10000n) / parseEther("1"));
                  hasRoyalty = true;
                }
              } catch (e) {}

              // Resolve metadata
              const metadataUrl = resolveIPFS(tokenURI);
              let metadata: NFTMetadata = {
                name: `${listing.collectionName} #${listing.tokenId}`,
                description: "",
                image: "/placeholder-nft.svg",
              };

              try {
                const res = await fetch(metadataUrl);
                if (res.ok) {
                  const data = await res.json();
                  metadata = {
                    name: data.name || metadata.name,
                    description: data.description || "",
                    image: resolveIPFS(data.image || ""),
                  };
                }
              } catch (e) {}

              return {
                ...listing,
                metadata,
                royaltyBps,
                hasRoyalty,
              };
            } catch (enrichErr) {
              console.error(`Error enriching scanned listing ${listing.nftAddress} #${listing.tokenId}:`, enrichErr);
              return listing;
            }
          })
        );

        setListings(enrichedScannedListings.filter(Boolean) as NFTListing[]);
      } catch (fallbackErr) {
        console.error("Critical fallback scanning failure:", fallbackErr);
        setError(fallbackErr instanceof Error ? fallbackErr : new Error("Fallback failed"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return { listings, isLoading, error, refetch: fetchState };
}
