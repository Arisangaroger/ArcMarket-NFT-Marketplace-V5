/**
 * IPFS Metadata Cache
 * Caches NFT metadata from IPFS in localStorage to avoid repeated fetches
 * Cache duration: 24 hours (metadata never changes)
 */

interface CachedMetadata {
  data: any;
  timestamp: number;
  url: string;
}

const CACHE_PREFIX = "ipfs_cache_";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 500; // Maximum number of cached items

/**
 * Generate a cache key from URL
 */
function getCacheKey(url: string): string {
  // Use the IPFS hash as the key (more reliable than full URL)
  const hash = url.match(/Qm[a-zA-Z0-9]{44}|ba[a-zA-Z0-9]{57}/)?.[0];
  return hash ? `${CACHE_PREFIX}${hash}` : `${CACHE_PREFIX}${btoa(url).slice(0, 50)}`;
}

/**
 * Check if cache is available (localStorage accessible)
 */
function isCacheAvailable(): boolean {
  try {
    const test = "__cache_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cached metadata if available and not expired
 */
export function getCachedMetadata(url: string): any | null {
  if (!isCacheAvailable()) return null;

  try {
    const key = getCacheKey(url);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;

    const parsed: CachedMetadata = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn("Error reading from cache:", error);
    return null;
  }
}

/**
 * Store metadata in cache
 */
export function setCachedMetadata(url: string, data: any): void {
  if (!isCacheAvailable()) return;

  try {
    const key = getCacheKey(url);
    const cached: CachedMetadata = {
      data,
      timestamp: Date.now(),
      url,
    };

    localStorage.setItem(key, JSON.stringify(cached));

    // Cleanup old cache if needed
    cleanupOldCache();
  } catch (error) {
    // If localStorage is full, clear old entries and try again
    if (error instanceof Error && error.name === "QuotaExceededError") {
      clearOldestCache();
      try {
        localStorage.setItem(getCacheKey(url), JSON.stringify({ data, timestamp: Date.now(), url }));
      } catch {
        console.warn("Cache storage full, could not save");
      }
    }
  }
}

/**
 * Fetch metadata with caching
 */
export async function fetchWithCache(url: string): Promise<any> {
  // Try to get from cache first
  const cached = getCachedMetadata(url);
  if (cached) {
    return cached;
  }

  // Fetch from network
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data = await response.json();

  // Store in cache
  setCachedMetadata(url, data);

  return data;
}

/**
 * Clean up expired cache entries
 */
function cleanupOldCache(): void {
  if (!isCacheAvailable()) return;

  try {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    // Remove expired entries
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed: CachedMetadata = JSON.parse(cached);
          if (now - parsed.timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    });

    // If still too many entries, remove oldest
    const remainingKeys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
    if (remainingKeys.length > MAX_CACHE_SIZE) {
      clearOldestCache();
    }
  } catch (error) {
    console.warn("Error cleaning cache:", error);
  }
}

/**
 * Clear oldest cache entries to free up space
 */
function clearOldestCache(): void {
  if (!isCacheAvailable()) return;

  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    // Get all cache entries with timestamps
    const entries: Array<{ key: string; timestamp: number }> = [];
    
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed: CachedMetadata = JSON.parse(cached);
          entries.push({ key, timestamp: parsed.timestamp });
        }
      } catch {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    });

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 20% of entries
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  } catch (error) {
    console.warn("Error clearing old cache:", error);
  }
}

/**
 * Clear all IPFS cache (useful for debugging)
 */
export function clearAllCache(): void {
  if (!isCacheAvailable()) return;

  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    cacheKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Error clearing all cache:", error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { count: number; size: number; oldestEntry: number | null } {
  if (!isCacheAvailable()) {
    return { count: 0, size: 0, oldestEntry: null };
  }

  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    let oldestTimestamp: number | null = null;

    cacheKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          const parsed: CachedMetadata = JSON.parse(value);
          if (!oldestTimestamp || parsed.timestamp < oldestTimestamp) {
            oldestTimestamp = parsed.timestamp;
          }
        }
      } catch {
        // Skip corrupted entries
      }
    });

    return {
      count: cacheKeys.length,
      size: totalSize,
      oldestEntry: oldestTimestamp,
    };
  } catch {
    return { count: 0, size: 0, oldestEntry: null };
  }
}
