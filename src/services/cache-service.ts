import type { KeyValueStore } from '@/platform/storage';
import type { RateSnapshot } from '@/types/exchange-rate';
import { sanitizeRates } from './providers/types';

const CACHE_KEY = 'currio.rates.v1';

/** Persists the latest rate snapshot in chrome.storage.local. */
export interface RateCache {
  read(providerId: string): Promise<RateSnapshot | null>;
  write(snapshot: RateSnapshot): Promise<void>;
  clear(): Promise<void>;
}

export function createRateCache(store: KeyValueStore): RateCache {
  return {
    async read(providerId) {
      const stored = await store.get<unknown>(CACHE_KEY);
      const snapshot = parseSnapshot(stored);
      return snapshot && snapshot.provider === providerId ? snapshot : null;
    },
    write: (snapshot) => store.set(CACHE_KEY, snapshot),
    clear: () => store.remove(CACHE_KEY),
  };
}

export function isFresh(snapshot: RateSnapshot, ttlMs: number, now: number): boolean {
  const age = now - snapshot.fetchedAt;
  return age >= 0 && age < ttlMs;
}

function parseSnapshot(value: unknown): RateSnapshot | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Partial<RateSnapshot>;
  const rates = sanitizeRates(v.rates);
  if (
    !rates ||
    typeof v.base !== 'string' ||
    typeof v.provider !== 'string' ||
    typeof v.fetchedAt !== 'number' ||
    typeof v.providerUpdatedAt !== 'number'
  ) {
    return null;
  }
  return { base: v.base, rates, fetchedAt: v.fetchedAt, providerUpdatedAt: v.providerUpdatedAt, provider: v.provider };
}
