"use client";
import { useState } from "react";
import { isAddress } from "viem";
import { useMarketStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export function ImportCollection() {
  const [address, setAddress] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { addCustomCollection } = useMarketStore();
  const router = useRouter();

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    
    const cleanAddress = address.trim();
    
    if (!isAddress(cleanAddress)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    setIsImporting(true);
    try {
      addCustomCollection(cleanAddress as `0x${string}`);
      toast.success("Collection imported successfully!");
      router.push(`/collection/${cleanAddress}`);
      setAddress("");
    } catch (err) {
      toast.error("Failed to import collection");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="relative group w-full max-w-md">
      <form onSubmit={handleImport} className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-cream-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Paste collection address (0x...)"
          className="w-full bg-cream-50 border border-cream-200 rounded-xl py-2.5 pl-10 pr-24 text-sm font-sans placeholder:text-cream-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
        />
        <div className="absolute inset-y-1.5 right-1.5">
          <Button
            type="submit"
            size="sm"
            className="h-full rounded-lg text-xs gap-1.5 px-3"
            loading={isImporting}
          >
            {isImporting ? "Importing..." : (
              <>
                <Plus size={14} /> Import
              </>
            )}
          </Button>
        </div>
      </form>
      
      {/* Tooltip/Hint */}
      <div className="absolute top-full left-0 mt-2 w-full p-3 bg-white border border-cream-200 rounded-xl shadow-xl opacity-0 translate-y-1 pointer-events-none group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all z-50">
        <div className="flex gap-2">
          <AlertCircle size={14} className="text-sky-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-cream-500 font-sans leading-relaxed">
            Enter any contract address to instantly support a new collection. The marketplace will automatically fetch metadata and enable minting/trading.
          </p>
        </div>
      </div>
    </div>
  );
}
