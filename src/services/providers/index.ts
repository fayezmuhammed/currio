import { createExchangeRateApiProvider } from './exchangerate-api';
import { openErApiProvider } from './open-er-api';
import type { ExchangeRateProvider } from './types';

/**
 * Picks the provider from build-time env (see .env.example). Only the
 * background service worker imports this module, so API keys never reach
 * content scripts.
 */
export function getConfiguredProvider(): ExchangeRateProvider {
  const id = import.meta.env.VITE_EXCHANGE_RATE_PROVIDER ?? 'open-er-api';
  const key = import.meta.env.VITE_EXCHANGE_RATE_API_KEY ?? '';
  if (id === 'exchangerate-api') {
    if (key) return createExchangeRateApiProvider(key);
    console.warn('[Currio] VITE_EXCHANGE_RATE_API_KEY is missing; using the free provider.');
  }
  return openErApiProvider;
}

export type { ExchangeRateProvider } from './types';
