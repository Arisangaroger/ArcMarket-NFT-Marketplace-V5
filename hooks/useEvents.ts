"use client";
import { useWatchContractEvent } from "wagmi";
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from "@/lib/constants";
import { useMarketStore } from "@/lib/store";
import { formatEth } from "@/lib/constants";

export function useMarketplaceEvents() {
  const { addNotification } = useMarketStore();

  useWatchContractEvent({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    eventName: "ItemBought",
    onLogs(logs) {
      logs.forEach((log) => {
        const { buyer, nftAddress, tokenId, price } = log.args as {
          buyer: string;
          nftAddress: string;
          tokenId: bigint;
          price: bigint;
        };
        addNotification({
          type: "sale",
          title: "NFT Sold",
          message: `NFT #${tokenId.toString()} sold for ${formatEth(price)} ETH`,
          amount: `${formatEth(price)} ETH`,
          txHash: log.transactionHash ?? undefined,
        });
      });
    },
  });

  useWatchContractEvent({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    eventName: "ItemListed",
    onLogs(logs) {
      logs.forEach((log) => {
        const { tokenId, price } = log.args as { tokenId: bigint; price: bigint };
        addNotification({
          type: "listing",
          title: "New Listing",
          message: `NFT #${tokenId.toString()} listed for ${formatEth(price)} ETH`,
          txHash: log.transactionHash ?? undefined,
        });
      });
    },
  });

  useWatchContractEvent({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    eventName: "ItemCancelled",
    onLogs(logs) {
      logs.forEach((log) => {
        const { tokenId } = log.args as { tokenId: bigint };
        addNotification({
          type: "info",
          title: "Listing Cancelled",
          message: `NFT #${tokenId.toString()} delisted`,
          txHash: log.transactionHash ?? undefined,
        });
      });
    },
  });
}
