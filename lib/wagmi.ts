import { createConfig, http } from "wagmi";
import { mainnet, sepolia, polygon, polygonMumbai } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID";

const metadata = {
  name: process.env.NEXT_PUBLIC_PLATFORM_NAME || "ArcMarket",
  description: "Next-generation transparent NFT Marketplace",
  url: "https://ArcMarket.xyz",
  icons: ["/logo.svg"],
};

export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet, polygon, polygonMumbai],
  connectors: [
    injected(),
    walletConnect({ projectId, metadata }),
    coinbaseWallet({ appName: metadata.name }),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
  },
});
