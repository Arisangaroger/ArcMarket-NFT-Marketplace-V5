export interface NFTListing {
  nftAddress: string;
  tokenId: string;
  price: bigint;
  seller: string;
  collectionName?: string;
  collectionSymbol?: string;
  metadata?: NFTMetadata;
  royaltyBps?: number;
  royaltyReceiver?: string;
  hasRoyalty?: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: { trait_type: string; value: string | number }[];
}

export interface Collection {
  address: string;
  name: string;
  symbol: string;
  creatorAddress: string;
  royaltyBps: number;
  royaltyReceiver: string;
  hasRoyalty: boolean;
  totalVolume: bigint;
  totalRoyaltiesPaid: bigint;
  floorPrice: bigint;
  listedCount: number;
  imageUri?: string;
  previewImages?: string[];
  contractURI?: string;
  description?: string;
  mintPrice?: bigint;
  totalSupply?: bigint;
  maxSupply?: bigint;
}

export interface UserProceeds {
  sellerProceeds: bigint;
  royaltyProceeds: bigint;
}

export interface PlatformStats {
  totalVolume: bigint;
  totalRoyaltiesPaid: bigint;
  totalPlatformFees: bigint;
  totalListings: number;
  totalSales: number;
}
