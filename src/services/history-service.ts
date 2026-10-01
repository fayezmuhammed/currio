import { isSupportedCurrency } from '@/constants/currencies';
import type { KeyValueStore } from '@/platform/storage';
import type { Conversion } from '@/types/exchange-rate';
import type { RecentConversion } from '@/types/settings';

/**
 * Stores only the most recent conversion's numbers in chrome.storage.local,
 * never the selected text, page URL or title. V2's conversion history can
 * grow this into a bounded list behind the same interface.
 */
export const RECENT_CONVERSION_KEY = 'recentConversion';

export interface HistoryService {
  getRecent(): Promise<RecentConversion | null>;
  record(conversion: Conversion, at?: number): Promise<void>;
  clear(): Promise<void>;
}

export function createHistoryService(store: KeyValueStore): HistoryService {
  return {
    async getRecent() {
      return parseRecent(await store.get<unknown>(RECENT_CONVERSION_KEY));
    },
    async record(conversion, at = Date.now()) {
      const recent: RecentConversion = {
        amount: conversion.amount,
        from: conversion.from,
        to: conversion.to,
        converted: conversion.converted,
        rate: conversion.rate,
        at,
      };
      await store.set(RECENT_CONVERSION_KEY, recent);
    },
    clear: () => store.remove(RECENT_CONVERSION_KEY),
  };
}

export function parseRecent(value: unknown): RecentConversion | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Partial<Record<keyof RecentConversion, unknown>>;
  if (
    typeof v.amount !== 'number' ||
    typeof v.converted !== 'number' ||
    typeof v.rate !== 'number' ||
    typeof v.at !== 'number' ||
    typeof v.from !== 'string' ||
    typeof v.to !== 'string' ||
    !isSupportedCurrency(v.from) ||
    !isSupportedCurrency(v.to)
  ) {
    return null;
  }
  return { amount: v.amount, from: v.from, to: v.to, converted: v.converted, rate: v.rate, at: v.at };
}
