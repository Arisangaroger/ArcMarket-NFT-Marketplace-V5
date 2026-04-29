# ArcMarket — NFT Marketplace V5

A next-generation, fully transparent NFT marketplace with ERC-2981 royalty support, complete price breakdowns, and a creator-first economy.

## Features

- **Full Price Transparency** — Every purchase shows exactly how much goes to seller, creator (royalty), and platform
- **ERC-2981 Royalty Support** — Detects and displays on-chain royalties with try/catch fallback
- **Dual Earnings Panel** — Seller proceeds and creator royalties tracked and withdrawn separately
- **Multi-Collection Hub** — Browse collections with royalty rankings and creator focus
- **Real-Time Events** — Live updates via on-chain event listeners
- **Smart Notifications** — Filtered by sales, royalties, listings
- **Admin Dashboard** — Platform revenue, analytics, and fee withdrawals
- **Approval Per Collection** — Per-NFT-contract approval detection

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local .env.local   # Already present — fill in values

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Edit `.env.local` and replace all placeholder values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Get from [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | Your deployed marketplace contract address |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID (`11155111` = Sepolia, `1` = Mainnet) |
| `NEXT_PUBLIC_RPC_URL` | Your RPC endpoint (Alchemy/Infura recommended) |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Optional Alchemy API key |
| `NEXT_PUBLIC_IPFS_GATEWAY` | IPFS gateway URL |
| `NEXT_PUBLIC_PLATFORM_NAME` | Your platform name (default: ArcMarket) |
| `NEXT_PUBLIC_PLATFORM_FEE_BPS` | Platform fee in basis points (200 = 2%) |

## Contract ABI

Replace the placeholder ABI in `lib/constants.ts` with your actual compiled contract ABI.
The ABI structure expects these functions: `listItem`, `buyItem`, `cancelListing`, `updateListing`,
`withdrawProceeds`, `withdrawRoyalties`, `withdrawPlatformFees`, `getProceeds`,
`getRoyaltyProceeds`, `getPlatformFees`, `getListing`.

## Project Structure

```
app/
  page.tsx                    # Home / Explore
  collection/[address]/       # Collection detail
  nft/[address]/[id]/         # NFT detail + buy/list
  profile/                    # User dashboard
  admin/                      # Admin panel
components/
  layout/                     # Navbar, Notifications, Providers
  nft/                        # NFTCard, CollectionCard, RoyaltyBadge, PriceBreakdown, EarningsPanel
  ui/                         # Button, Input, Modal, Card, Badge, Skeleton, TxStatus
hooks/
  useListings.ts              # list, buy, cancel, update
  useRoyalties.ts             # ERC-2981 royalty reads + proceeds
  useProceeds.ts              # seller proceeds + withdrawal hooks
  useApproval.ts              # per-collection approval
  useEvents.ts                # real-time event listeners
lib/
  constants.ts                # ABIs, helpers, price breakdown calculator
  wagmi.ts                    # wagmi + WalletConnect config
  store.ts                    # Zustand global state (notifications, tx status)
  types.ts                    # TypeScript interfaces
```

## Replacing Mock Data

Mock data is used throughout for UI preview. Replace with real reads:

- **Listings** — Query your contract's `ItemListed` events or use a subgraph
- **Collections** — Fetch from on-chain reads or a subgraph
- **NFT Metadata** — Fetch from `tokenURI()` → resolve IPFS → fetch JSON

## Stack

- **Next.js 14** (App Router)
- **wagmi v2** + **viem** — Ethereum interactions
- **WalletConnect** — Multi-wallet support
- **Tailwind CSS** — Styling
- **Zustand** — Global state
- **Framer Motion** — Animations
- **Sonner** — Toast notifications
- **Lucide React** — Icons
