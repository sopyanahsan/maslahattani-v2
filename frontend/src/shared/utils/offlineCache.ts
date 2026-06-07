/**
 * offlineCache — Simple in-memory + localStorage cache for API responses.
 *
 * Strategy:
 * - GET requests are cached by URL+params key
 * - On successful fetch: save to cache
 * - On failed fetch (offline): return cached data
 * - Cache TTL: 30 minutes (stale data is better than no data)
 *
 * NOT cached: POST, PUT, DELETE (mutations go to pending queue)
 */

const CACHE_PREFIX = 'api_cache_';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
  url: string;
}

// In-memory cache (faster than localStorage for same session)
const memoryCache = new Map<string, CacheEntry>();

/**
 * Generate a cache key from URL + params
 */
export function getCacheKey(url: string, params?: Record<string, any>): string {
  const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `${url}|${paramStr}`;
}

/**
 * Save API response to cache (memory + localStorage)
 */
export function setCacheEntry(key: string, data: any): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    url: key,
  };

  // Memory cache
  memoryCache.set(key, entry);

  // localStorage (persist across page refreshes)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full — evict oldest entries
    evictOldEntries();
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Still full — only use memory cache
    }
  }
}

/**
 * Get cached API response. Returns null if not found or expired.
 */
export function getCacheEntry(key: string, ttlMs: number = DEFAULT_TTL_MS): any | null {
  // Try memory first (fastest)
  const memEntry = memoryCache.get(key);
  if (memEntry && Date.now() - memEntry.timestamp < ttlMs) {
    return memEntry.data;
  }

  // Try localStorage
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp < ttlMs) {
        // Warm up memory cache
        memoryCache.set(key, entry);
        return entry.data;
      } else {
        // Expired — remove
        localStorage.removeItem(CACHE_PREFIX + key);
      }
    }
  } catch {
    // Corrupted entry
  }

  return null;
}

/**
 * Get cached entry even if expired (for offline fallback — stale data > no data)
 */
export function getCacheEntryStale(key: string): any | null {
  // Try memory
  const memEntry = memoryCache.get(key);
  if (memEntry) return memEntry.data;

  // Try localStorage (even expired)
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      return entry.data;
    }
  } catch {
    // Corrupted
  }

  return null;
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  memoryCache.clear();
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}

/**
 * Evict oldest 20 entries from localStorage to free space
 */
function evictOldEntries(): void {
  const entries: Array<{ key: string; timestamp: number }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const entry = JSON.parse(raw);
          entries.push({ key, timestamp: entry.timestamp || 0 });
        }
      } catch {
        // Remove corrupted
        localStorage.removeItem(key!);
      }
    }
  }

  // Sort oldest first, remove 20
  entries.sort((a, b) => a.timestamp - b.timestamp);
  const toRemove = entries.slice(0, 20);
  toRemove.forEach(e => localStorage.removeItem(e.key));
}
