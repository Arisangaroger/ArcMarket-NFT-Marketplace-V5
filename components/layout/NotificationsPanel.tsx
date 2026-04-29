"use client";
import { useMarketStore, NotificationType } from "@/lib/store";
import { DollarSign, Gem, Tag, Info, X, CheckCheck, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

type FilterType = "all" | NotificationType;

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  sale: <DollarSign size={13} />,
  royalty: <Gem size={13} />,
  listing: <Tag size={13} />,
  error: <X size={13} />,
  info: <Info size={13} />,
};

const COLOR_MAP: Record<NotificationType, string> = {
  sale: "bg-sky-100 text-sky-600",
  royalty: "bg-violet-100 text-violet-600",
  listing: "bg-amber-100 text-amber-600",
  error: "bg-coral-100 text-coral-600",
  info: "bg-cream-100 text-cream-500",
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface Props { onClose: () => void; }

export function NotificationsPanel({ onClose }: Props) {
  const { notifications, markAllRead, clearNotification } = useMarketStore();
  const [filter, setFilter] = useState<FilterType>("all");

  const FILTERS: FilterType[] = ["all", "sale", "royalty", "listing"];

  const filtered =
    filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-cream-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cream-100">
          <h3 className="text-sm font-display font-semibold text-cream-900">Notifications</h3>
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-700 font-sans"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1 px-3 py-2 border-b border-cream-100">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "capitalize text-xs px-2.5 py-1 rounded-lg font-sans transition-colors",
                filter === f
                  ? "bg-sky-100 text-sky-700 font-medium"
                  : "text-cream-500 hover:bg-cream-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-cream-50">
          {filtered.length === 0 ? (
            <p className="text-sm text-cream-400 text-center py-8 font-sans">No notifications</p>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={clsx(
                  "flex items-start gap-3 px-4 py-3 transition-colors",
                  !n.read && "bg-sky-50/40"
                )}
              >
                <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5", COLOR_MAP[n.type])}>
                  {ICON_MAP[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-cream-800">{n.title}</p>
                  <p className="text-xs text-cream-500 font-sans mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-cream-300 font-sans">{timeAgo(n.timestamp)}</span>
                    {n.txHash && (
                      <a
                        href={`https://etherscan.io/tx/${n.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-600"
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => clearNotification(n.id)}
                  className="text-cream-300 hover:text-cream-600 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
