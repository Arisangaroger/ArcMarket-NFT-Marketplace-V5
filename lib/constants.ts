// ─── Chain & Contract Config ──────────────────────────────────────
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");
export const MARKETPLACE_ADDRESS = (process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME || "ArcMarket";
export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
export const PLATFORM_FEE_BPS = parseInt(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS || "200");

// ─── Marketplace ABI ──────────────────────────────────────────────
// Replace with your actual compiled ABI
export const MARKETPLACE_ABI = [
  // Events
  {
    type: "event",
    name: "ItemListed",
    inputs: [
      { name: "seller", type: "address", indexed: true },
      { name: "nftAddress", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "price", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ItemBought",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "nftAddress", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "price", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ItemCancelled",
    inputs: [
      { name: "seller", type: "address", indexed: true },
      { name: "nftAddress", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ItemUpdated",
    inputs: [
      { name: "seller", type: "address", indexed: true },
      { name: "nftAddress", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "newPrice", type: "uint256" },
    ],
  },
  // Read Functions (Mappings & Public Variables)
  {
    type: "function",
    name: "listings",
    stateMutability: "view",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "proceeds",
    stateMutability: "view",
    inputs: [{ name: "seller", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "royalties",
    stateMutability: "view",
    inputs: [{ name: "receiver", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "marketplaceBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "feePercent",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Write Functions
  {
    type: "function",
    name: "listItem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "buyItem",
    stateMutability: "payable",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelListing",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateListing",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nftAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "newPrice", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawProceeds",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawRoyalties",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawMarketplaceFees",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

// ─── ERC721 ABI (minimal) ─────────────────────────────────────────
export const ERC721_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// ─── Collection ABI (Uniform Standard) ──────────────────────────
export const COLLECTION_ABI = [
  ...ERC721_ABI,
  {
    type: "function",
    name: "mintPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_SUPPLY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintNFT",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "contractURI",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "baseURI",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// ─── ERC2981 ABI (royalty standard) ──────────────────────────────
export const ERC2981_ABI = [
  {
    type: "function",
    name: "royaltyInfo",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "salePrice", type: "uint256" },
    ],
    outputs: [
      { name: "receiver", type: "address" },
      { name: "royaltyAmount", type: "uint256" },
    ],
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────
export function resolveIPFS(uri: string): string {
  if (!uri) return "/placeholder-nft.svg";
  
  // Handle ipfs:// protocol
  if (uri.startsWith("ipfs://")) {
    return `${IPFS_GATEWAY}${uri.slice(7).replace(/^ipfs\//, "")}`;
  }
  
  // Handle ipfs/ path
  if (uri.startsWith("ipfs/")) {
    return `${IPFS_GATEWAY}${uri.slice(5)}`;
  }
  
  // Handle raw CID (standard Qm... or ba...)
  if (uri.startsWith("Qm") || uri.startsWith("ba")) {
    return `${IPFS_GATEWAY}${uri}`;
  }
  
  return uri;
}

export function shortenAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatEth(wei: bigint | string | number, decimals = 4): string {
  const value = typeof wei === "bigint" ? wei : BigInt(wei.toString());
  const eth = Number(value) / 1e18;
  return eth.toFixed(decimals).replace(/\.?0+$/, "");
}

export function bpsToPercent(bps: number): number {
  return bps / 100;
}

// Price breakdown calculator
export interface PriceBreakdown {
  total: bigint;
  sellerReceives: bigint;
  royaltyAmount: bigint;
  platformFee: bigint;
  royaltyBps: number;
  platformBps: number;
}

export function calcBreakdown(
  priceWei: bigint,
  royaltyBps: number,
  platformBps: number
): PriceBreakdown {
  const royaltyAmount = (priceWei * BigInt(royaltyBps)) / BigInt(10000);
  const platformFee = (priceWei * BigInt(platformBps)) / BigInt(10000);
  const sellerReceives = priceWei - royaltyAmount - platformFee;
  return {
    total: priceWei,
    sellerReceives,
    royaltyAmount,
    platformFee,
    royaltyBps,
    platformBps,
  };
}
