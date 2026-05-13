import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "sale" | "royalty" | "listing" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  txHash?: string;
  amount?: string;
}

export interface ActiveTx {
  status: "idle" | "pending" | "confirming" | "success" | "error";
  message: string;
  txHash?: string;
}

interface MarketStore {
  notifications: Notification[];
  activeTx: ActiveTx;
  customCollections: `0x${string}`[];
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  setActiveTx: (tx: Partial<ActiveTx>) => void;
  addCustomCollection: (address: `0x${string}`) => void;
  resetTx: () => void;
  unreadCount: () => number;
}

export const useMarketStore = create<MarketStore>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: "1",
          type: "royalty",
          title: "Royalty Earned",
          message: "You earned 0.05 ETH royalty from NFT #42",
          timestamp: Date.now() - 120000,
          read: false,
          amount: "0.05 ETH",
        },
        {
          id: "2",
          type: "sale",
          title: "NFT Sold",
          message: "Your NFT #7 sold for 1.2 ETH",
          timestamp: Date.now() - 3600000,
          read: false,
          amount: "1.2 ETH",
        },
        {
          id: "3",
          type: "listing",
          title: "Listing Updated",
          message: "NFT #12 price updated to 0.5 ETH",
          timestamp: Date.now() - 7200000,
          read: true,
        },
      ],
      activeTx: { status: "idle", message: "" },
      customCollections: [],

      addNotification: (n) =>
        set((s) => ({
          notifications: [
            {
              ...n,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              read: false,
            },
            ...s.notifications,
          ],
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      setActiveTx: (tx) =>
        set((s) => ({ activeTx: { ...s.activeTx, ...tx } })),

      addCustomCollection: (address) =>
        set((s) => {
          if (s.customCollections.some((a) => a.toLowerCase() === address.toLowerCase())) return s;
          return { customCollections: [...s.customCollections, address] };
        }),

      resetTx: () =>
        set({ activeTx: { status: "idle", message: "" } }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: "arc-market-storage",
      partialize: (state) => ({
        customCollections: state.customCollections,
        notifications: state.notifications,
      }),
    }
  )
);
