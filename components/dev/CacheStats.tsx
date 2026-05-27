"use client";
import { useState, useEffect } from "react";
import { getCacheStats, clearAllCache } from "@/lib/ipfsCache";

/**
 * Developer component to show IPFS cache statistics
 * Only render this in development or admin pages
 */
export function CacheStats() {
  const [stats, setStats] = useState({ count: 0, size: 0, oldestEntry: null as number | null });
  const [showDetails, setShowDetails] = useState(false);

  const refreshStats = () => {
    setStats(getCacheStats());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleClearCache = () => {
    if (confirm("Clear all IPFS cache? This will slow down the next page load.")) {
      clearAllCache();
      refreshStats();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatAge = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    const hours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
    if (hours < 1) return "< 1 hour";
    if (hours < 24) return `${hours} hours`;
    return `${Math.floor(hours / 24)} days`;
  };

  if (!showDetails) {
    return (
      <button
        onClick={() => setShowDetails(true)}
        className="fixed bottom-4 right-4 bg-white border border-cream-200 rounded-lg px-3 py-2 text-xs font-mono text-cream-600 hover:bg-cream-50 transition-colors shadow-md z-50"
        title="Show IPFS cache stats"
      >
        📦 Cache: {stats.count} items
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-cream-200 rounded-xl p-4 shadow-lg z-50 w-72">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-cream-900">IPFS Cache Stats</h3>
        <button
          onClick={() => setShowDetails(false)}
          className="text-cream-400 hover:text-cream-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-cream-600">Cached Items:</span>
          <span className="font-semibold text-cream-900">{stats.count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cream-600">Cache Size:</span>
          <span className="font-semibold text-cream-900">{formatSize(stats.size)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cream-600">Oldest Entry:</span>
          <span className="font-semibold text-cream-900">{formatAge(stats.oldestEntry)}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={refreshStats}
          className="flex-1 bg-cream-100 hover:bg-cream-200 text-cream-700 text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={handleClearCache}
          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          Clear Cache
        </button>
      </div>

      <p className="text-[10px] text-cream-400 mt-2 text-center">
        Cache expires after 24 hours
      </p>
    </div>
  );
}
