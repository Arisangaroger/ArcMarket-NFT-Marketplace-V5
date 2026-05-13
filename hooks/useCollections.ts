"use client";
import { useState, useEffect, useCallback } from "react";
import { useReadContracts, useAccount, usePublicClient } from "wagmi";
import { ERC721_ABI, ERC2981_ABI, COLLECTION_ABI, resolveIPFS } from "@/lib/constants";
import { COLLECTION_ADDRESSES } from "@/lib/collections-config";
import { Collection } from "@/lib/types";
import { useMarketplaceState } from "./useMarketplaceState";
import { useMarketStore } from "@/lib/store";
import { parseEther } from "viem";

export function useCollections() {
  const { customCollections } = useMarketStore();
  const allAddresses = [...new Set([...COLLECTION_ADDRESSES, ...customCollections])];

  // Store for extra previews we've resolved from tokenURIs
  const [injectedPreviews, setInjectedPreviews] = useState<Record<string, string[]>>({});

  const contracts = allAddresses.flatMap((address) => [
    { address, abi: ERC721_ABI, functionName: "name" },
    { address, abi: ERC721_ABI, functionName: "symbol" },
    { address, abi: ERC721_ABI, functionName: "owner" },
    { address, abi: ERC2981_ABI, functionName: "royaltyInfo", args: [1n, 10000n] },
    { address, abi: COLLECTION_ABI, functionName: "mintPrice" },
    { address, abi: COLLECTION_ABI, functionName: "totalMinted" },
    { address, abi: COLLECTION_ABI, functionName: "MAX_SUPPLY" },
    { address, abi: COLLECTION_ABI, functionName: "maxSupply" },
    { address, abi: COLLECTION_ABI, functionName: "contractURI" },
    { address, abi: COLLECTION_ABI, functionName: "baseURI" },
    // Preview tokens 1-4
    { address, abi: ERC721_ABI, functionName: "tokenURI", args: [1n] },
    { address, abi: ERC721_ABI, functionName: "tokenURI", args: [2n] },
    { address, abi: ERC721_ABI, functionName: "tokenURI", args: [3n] },
    { address, abi: ERC721_ABI, functionName: "tokenURI", args: [4n] },
  ]);

  const { listings: allListings, isLoading: isLoadingListings } = useMarketplaceState();

  const { data, isLoading: isLoadingContracts, error, refetch } = useReadContracts({
    contracts: contracts as any,
  });

  // Effect to resolve images from tokenURIs that aren't in listings
  useEffect(() => {
    if (!data || isLoadingContracts) return;

    const resolveMissing = async () => {
      const newInjections: Record<string, string[]> = { ...injectedPreviews };
      let changed = false;

      for (let i = 0; i < allAddresses.length; i++) {
        const address = allAddresses[i];
        const offset = i * 14;
        
        // If we already have 4 images for this collection, skip
        const currentListings = allListings.filter(l => l.nftAddress.toLowerCase() === address.toLowerCase());
        if (currentListings.length >= 4 || newInjections[address]?.length >= 4) continue;

        // Collect tokenURIs (tokens 1-4 are at offset + 10, 11, 12, 13)
        let uris = [
          data[offset + 10]?.result as string,
          data[offset + 11]?.result as string,
          data[offset + 12]?.result as string,
          data[offset + 13]?.result as string,
        ].filter(Boolean);

        // --- UNMINTED FALLBACK LOGIC ---
        // If no tokens are minted, try to derive base URI from contractURI or baseURI
        if (uris.length === 0) {
          const contractURI = data[offset + 8]?.result as string | undefined;
          const baseURI = data[offset + 9]?.result as string | undefined;
          
          let sourceURI = contractURI || baseURI;
          
          if (sourceURI && typeof sourceURI === "string" && sourceURI.length > 5) {
            // Clean the base: remove any filename.json from the end
            // If it ends in .json, strip the filename
            let base = sourceURI.replace(/\/[^/]+\.json$/, "/");
            // If it didn't end in .json but doesn't end in /, and isn't a likely CID, add /
            if (base === sourceURI && !base.endsWith("/") && (base.includes("/") || base.includes("ipfs"))) {
              base += "/";
            }
            // If it's a raw CID (no slashes), add a slash
            if (!base.includes("/")) base += "/";
            
            // --- CUSTOM SEQUENCES PER COLLECTION ---
            let ids: number[] = [];
            if (i === 0) {
              // Collection 1: 1 to 10
              ids = Array.from({ length: 10 }, (_, k) => k + 1);
            } else if (i === 1) {
              // Collection 2: 10 to 1
              ids = Array.from({ length: 10 }, (_, k) => 10 - k);
            } else if (i === 2) {
              // Collection 3: Odd numbers 1 to 10
              ids = [1, 3, 5, 7, 9];
            } else {
              // Default
              ids = [1, 2, 3, 4];
            }
            
            uris = ids.map(id => `${base}${id}.json`);
          }
        }

        // --- SMART PREDICTION LOGIC ---
        // If some are unminted (missing URIs), but we have at least one (usually ID 1),
        // we try to "guess" the others by replacing the ID in the string.
        if (uris.length > 0 && uris.length < 4) {
          const firstUri = uris[0];
          const predicted: string[] = [...uris];
          
          for (let id = 1; id <= 4; id++) {
            if (predicted.length >= 4) break;
            
            // Try common patterns: replace "1" with "id"
            // e.g. ipfs://CID/1 -> ipfs://CID/2
            const newUri = firstUri.replace(/(\/|%2F)1(\.json)?$/, `$1${id}$2`);
            if (newUri !== firstUri && !predicted.includes(newUri)) {
              predicted.push(newUri);
            }
          }
          uris = predicted;
        }

        if (uris.length === 0) continue;

        const resolvedImages: string[] = [];
        // Use a Set to avoid duplicates and limit to 4
        const uniqueUris = Array.from(new Set(uris)).slice(0, 4);

        for (const uri of uniqueUris) {
          try {
            const url = resolveIPFS(uri);
            const res = await fetch(url);
            if (res.ok) {
              const meta = await res.json();
              if (meta.image) {
                const imgUrl = resolveIPFS(meta.image);
                if (!resolvedImages.includes(imgUrl)) {
                   resolvedImages.push(imgUrl);
                }
              }
            }
          } catch (e) {
            // Silently fail for individual images
          }
        }

        if (resolvedImages.length > 0) {
          newInjections[address] = resolvedImages;
          changed = true;
        }
      }

      if (changed) {
        setInjectedPreviews(newInjections);
      }
    };

    resolveMissing();
  }, [data, isLoadingContracts, allAddresses.length]);

  const collections: Collection[] = allAddresses.map((address, i) => {
    const offset = i * 14;
    const name = (data?.[offset]?.result as string) || "Unknown Collection";
    const symbol = (data?.[offset + 1]?.result as string) || "???";
    const owner = (data?.[offset + 2]?.result as string) || "0x0000000000000000000000000000000000000000";
    const royalty = data?.[offset + 3]?.result as [string, bigint] | undefined;
    const mintPrice = data?.[offset + 4]?.result as bigint | undefined;
    const totalSupply = data?.[offset + 5]?.result as bigint | undefined;
    const maxSupplyUpper = data?.[offset + 6]?.result as bigint | undefined;
    const maxSupplyLower = data?.[offset + 7]?.result as bigint | undefined;
    const contractURI = data?.[offset + 8]?.result as string | undefined;

    const maxSupply = maxSupplyUpper ?? maxSupplyLower;

    const hasRoyalty = !!royalty && royalty[1] > 0n;
    const royaltyBps = royalty ? Number(royalty[1]) : 0;
    const royaltyReceiver = royalty ? royalty[0] : owner;

    // Filter listings for this collection
    const collectionListings = allListings.filter(
      (l) => l.nftAddress.toLowerCase() === address.toLowerCase()
    );

    const floorPrice = collectionListings.length > 0
      ? collectionListings.reduce((min, l) => (l.price < min ? l.price : min), collectionListings[0].price)
      : 0n;

    // Hybrid Preview Logic: Listings + Injected
    const listingImages = collectionListings
      .map((l) => l.metadata?.image)
      .filter((img): img is string => !!img);
    
    const injected = injectedPreviews[address] || [];
    
    // Merge and unique
    const combined = [...new Set([...listingImages, ...injected])].slice(0, 4);

    return {
      address,
      name,
      symbol,
      creatorAddress: owner,
      royaltyBps,
      royaltyReceiver,
      hasRoyalty,
      totalVolume: 0n,
      totalRoyaltiesPaid: 0n,
      floorPrice,
      listedCount: collectionListings.length,
      description: `Official ${name} collection.`,
      imageUri: combined[0] || "/placeholder-nft.svg",
      previewImages: combined,
      contractURI,
      mintPrice,
      totalSupply,
      maxSupply,
    };
  });

  return {
    collections,
    isLoading: isLoadingContracts || isLoadingListings,
    error,
    refetch,
  };

}

  export function useCollection(address: string | undefined) {
  const contracts = [
    { address: address as `0x${string}`, abi: ERC721_ABI, functionName: "name" },
    { address: address as `0x${string}`, abi: ERC721_ABI, functionName: "symbol" },
    { address: address as `0x${string}`, abi: ERC721_ABI, functionName: "owner" },
    { address: address as `0x${string}`, abi: ERC2981_ABI, functionName: "royaltyInfo", args: [1n, 10000n] },
    { address: address as `0x${string}`, abi: COLLECTION_ABI, functionName: "mintPrice" },
    { address: address as `0x${string}`, abi: COLLECTION_ABI, functionName: "totalMinted" },
    { address: address as `0x${string}`, abi: COLLECTION_ABI, functionName: "MAX_SUPPLY" },
    { address: address as `0x${string}`, abi: COLLECTION_ABI, functionName: "maxSupply" },
    { address: address as `0x${string}`, abi: COLLECTION_ABI, functionName: "contractURI" },
    { address: address as `0x${string}`, abi: COLLECTION_ABI, functionName: "baseURI" },
    // Previews
    { address: address as `0x${string}`, abi: ERC721_ABI, functionName: "tokenURI", args: [1n] },
    { address: address as `0x${string}`, abi: ERC721_ABI, functionName: "tokenURI", args: [2n] },
    { address: address as `0x${string}`, abi: ERC721_ABI, functionName: "tokenURI", args: [3n] },
    { address: address as `0x${string}`, abi: ERC721_ABI, functionName: "tokenURI", args: [4n] },
  ];

  const { listings: allListings, isLoading: isLoadingListings } = useMarketplaceState();

  const { data, isLoading: isLoadingContracts, error, refetch } = useReadContracts({
    contracts: contracts as any,
    query: { enabled: !!address },
  });

  const [injected, setInjected] = useState<string[]>([]);

  useEffect(() => {
    if (!address || !data || isLoadingContracts) return;
    
    const resolve = async () => {
      let uris = [
        data[10]?.result as string,
        data[11]?.result as string,
        data[12]?.result as string,
        data[13]?.result as string,
      ].filter(Boolean);

      // --- UNMINTED FALLBACK LOGIC (Single Collection) ---
      if (uris.length === 0) {
        const contractURI = data[8]?.result as string | undefined;
        const baseURI = data[9]?.result as string | undefined;
        const sourceURI = contractURI || baseURI;

        if (sourceURI && typeof sourceURI === "string" && sourceURI.length > 5) {
          let base = sourceURI.replace(/\/[^/]+\.json$/, "/");
          if (base === sourceURI && !base.endsWith("/") && (base.includes("/") || base.includes("ipfs"))) {
            base += "/";
          }
          if (!base.includes("/")) base += "/";

          // Determine index for custom sequence
          const { customCollections } = useMarketStore.getState();
          const allAddresses = [...new Set([...COLLECTION_ADDRESSES, ...customCollections])];
          const collectionIndex = allAddresses.findIndex(addr => addr.toLowerCase() === address?.toLowerCase());

          let ids: number[] = [];
          if (collectionIndex === 0) {
            ids = Array.from({ length: 10 }, (_, k) => k + 1);
          } else if (collectionIndex === 1) {
            ids = Array.from({ length: 10 }, (_, k) => 10 - k);
          } else if (collectionIndex === 2) {
            ids = [1, 3, 5, 7, 9];
          } else {
            ids = [1, 2, 3, 4];
          }

          uris = ids.map(id => `${base}${id}.json`);
        }
      }

      // Smart Prediction for unminted tokens in single collection view
      if (uris.length > 0 && uris.length < 4) {
        const firstUri = uris[0];
        const predicted = [...uris];
        for (let id = 1; id <= 4; id++) {
          if (predicted.length >= 4) break;
          const newUri = firstUri.replace(/(\/|%2F)1(\.json)?$/, `$1${id}$2`);
          if (newUri !== firstUri && !predicted.includes(newUri)) {
            predicted.push(newUri);
          }
        }
        uris = predicted;
      }

      const resolved: string[] = [];
      const uniqueUris = Array.from(new Set(uris)).slice(0, 4);

      for (const uri of uniqueUris) {
        try {
          const url = resolveIPFS(uri);
          const res = await fetch(url);
          if (res.ok) {
            const meta = await res.json();
            if (meta.image) {
              const imgUrl = resolveIPFS(meta.image);
              if (!resolved.includes(imgUrl)) resolved.push(imgUrl);
            }
          }
        } catch {}
      }
      setInjected(resolved);
    };
    resolve();
  }, [address, data, isLoadingContracts]);

  const collection = address && data ? (() => {
    const name = (data[0]?.result as string) || "Unknown Collection";
    const symbol = (data[1]?.result as string) || "???";
    const owner = (data[2]?.result as string) || "0x0000000000000000000000000000000000000000";
    const royalty = data[3]?.result as [string, bigint] | undefined;
    const mintPrice = data[4]?.result as bigint | undefined;
    const totalSupply = data[5]?.result as bigint | undefined;
    const maxSupplyUpper = data[6]?.result as bigint | undefined;
    const maxSupplyLower = data[7]?.result as bigint | undefined;
    const contractURI = data[8]?.result as string | undefined;

    const maxSupply = maxSupplyUpper ?? maxSupplyLower;

    const hasRoyalty = !!royalty && royalty[1] > 0n;
    const royaltyBps = royalty ? Number(royalty[1]) : 0;
    const royaltyReceiver = royalty ? royalty[0] : owner;

    const collectionListings = allListings.filter(
      (l) => l.nftAddress.toLowerCase() === address.toLowerCase()
    );

    const floorPrice = collectionListings.length > 0
      ? collectionListings.reduce((min, l) => (l.price < min ? l.price : min), collectionListings[0].price)
      : 0n;

    const listingImages = collectionListings
      .map((l) => l.metadata?.image)
      .filter((img): img is string => !!img);
    
    const combined = [...new Set([...listingImages, ...injected])].slice(0, 4);

    return {
      address,
      name,
      symbol,
      creatorAddress: owner,
      royaltyBps,
      royaltyReceiver,
      hasRoyalty,
      totalVolume: 0n,
      totalRoyaltiesPaid: 0n,
      floorPrice,
      listedCount: collectionListings.length,
      description: `Official ${name} collection.`,
      imageUri: combined[0] || "/placeholder-nft.svg",
      previewImages: combined,
      contractURI,
      mintPrice,
      totalSupply,
      maxSupply,
    } as Collection;
  })() : undefined;

  return {
    collection,
    isLoading: isLoadingContracts || isLoadingListings,
    error,
    refetch,
  };
}

export function useUserCollectionNFTs(address: string | undefined) {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const [ownedNFTs, setOwnedNFTs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOwned = useCallback(async () => {
    if (!address || !userAddress || !publicClient) return;
    setIsLoading(true);

    try {
      const userLower = userAddress.toLowerCase();
      
      // 1. Get Collection Stats
      const [name, symbol, totalSupplyRaw] = await Promise.all([
        publicClient.readContract({ address: address as `0x${string}`, abi: ERC721_ABI, functionName: "name" }),
        publicClient.readContract({ address: address as `0x${string}`, abi: ERC721_ABI, functionName: "symbol" }),
        publicClient.readContract({ address: address as `0x${string}`, abi: COLLECTION_ABI, functionName: "totalSupply" }).catch(() => 0n),
      ]) as [string, string, bigint];

      const totalSupply = Number(totalSupplyRaw);
      const colName = name || symbol || "Unknown Collection";
      const maxToScan = totalSupply > 0 ? totalSupply : 20;

      // 2. Scan for Ownership (Same as Profile Page)
      const discoveredIds: bigint[] = [];
      const batchSize = 20;
      
      for (let i = 1; i <= maxToScan; i += batchSize) {
        const batchEnd = Math.min(i + batchSize - 1, maxToScan);
        const promises = [];
        
        for (let j = i; j <= batchEnd; j++) {
          promises.push(
            publicClient.readContract({
              address: address as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "ownerOf",
              args: [BigInt(j)],
            }).then(owner => ({ id: BigInt(j), owner: (owner as string).toLowerCase() }))
              .catch(() => null)
          );
        }

        const results = await Promise.all(promises);
        for (const res of results) {
          if (res && res.owner === userLower) {
            discoveredIds.push(res.id);
          }
        }
      }

      // 3. Resolve Metadata
      const nfts = await Promise.all(
        discoveredIds.map(async (id) => {
          try {
            const uri = await publicClient.readContract({
              address: address as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "tokenURI",
              args: [id],
            }) as string;

            const res = await fetch(resolveIPFS(uri));
            const meta = await res.json();
            return {
              tokenId: id.toString(),
              metadata: {
                ...meta,
                image: resolveIPFS(meta.image || ""),
              },
            };
          } catch (e) {
            return { 
              tokenId: id.toString(), 
              metadata: { 
                name: `${colName} #${id}`, 
                image: "/placeholder-nft.svg" 
              } 
            };
          }
        })
      );

      setOwnedNFTs(nfts);
    } catch (error) {
      console.error("Error fetching owned NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, userAddress, publicClient]);

  useEffect(() => {
    fetchOwned();
  }, [fetchOwned]);

  return { ownedNFTs, isLoading, refetch: fetchOwned };
}

