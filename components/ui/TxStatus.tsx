"use client";
import { useMarketStore } from "@/lib/store";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { clsx } from "clsx";

export function TxStatusBar() {
  const { activeTx, resetTx } = useMarketStore();

  if (activeTx.status === "idle") return null;

  const isSuccess = activeTx.status === "success";
  const isError = activeTx.status === "error";

  return (
    <div
      className={clsx(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg border text-sm font-medium font-sans min-w-[280px] animate-slide-up",
        {
          "bg-white border-cream-200 text-cream-700": activeTx.status === "pending" || activeTx.status === "confirming",
          "bg-sage-50 border-sage-200 text-sage-800": isSuccess,
          "bg-coral-50 border-coral-200 text-coral-800": isError,
        }
      )}
    >
      {(activeTx.status === "pending" || activeTx.status === "confirming") && (
        <Loader2 size={16} className="animate-spin text-sky-500 shrink-0" />
      )}
      {isSuccess && <CheckCircle2 size={16} className="text-sage-600 shrink-0" />}
      {isError && <XCircle size={16} className="text-coral-600 shrink-0" />}

      <span className="flex-1">{activeTx.message}</span>

      {activeTx.txHash && (
        <a
          href={`https://etherscan.io/tx/${activeTx.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-500 hover:text-sky-700"
        >
          <ExternalLink size={13} />
        </a>
      )}

      {(isSuccess || isError) && (
        <button onClick={resetTx} className="ml-1 text-cream-400 hover:text-cream-700 text-xs">
          ✕
        </button>
      )}
    </div>
  );
}
