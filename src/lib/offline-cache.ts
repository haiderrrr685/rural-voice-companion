/**
 * Offline cache — stores recent Q&A exchanges in localStorage
 * so users can review past answers without connectivity.
 */

const CACHE_KEY = "rural-ai-exchanges";
const MAX_ENTRIES = 20;

export interface CachedExchange {
  id: string;
  timestamp: number;
  question: string;
  answer: string;
  agent: string;
  language: string;
}

/**
 * Save a Q&A exchange to localStorage.
 */
export function saveExchange(
  question: string,
  answer: string,
  agent: string,
  language: string,
): void {
  try {
    const existing = getRecentExchanges(MAX_ENTRIES - 1);
    const entry: CachedExchange = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      question,
      answer,
      agent,
      language,
    };
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be full or unavailable — silently fail
  }
}

/**
 * Retrieve recent exchanges from localStorage.
 */
export function getRecentExchanges(limit = 10): CachedExchange[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed: CachedExchange[] = JSON.parse(raw);
    return parsed.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Clear all cached exchanges.
 */
export function clearExchangeCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // silently fail
  }
}

/**
 * Check current connectivity status.
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
