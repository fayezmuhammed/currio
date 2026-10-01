import type { CurrencyCode } from './currency';

/** Rates keyed by ISO code: units of that currency per 1 unit of `base`. */
export type RateTable = Readonly<Record<string, number>>;

/** A complete set of rates as returned by a provider and stored in the cache. */
export interface RateSnapshot {
  base: string;
  rates: RateTable;
  /** When Currio fetched the snapshot (ms since epoch). */
  fetchedAt: number;
  /** When the provider last updated its rates (ms since epoch). */
  providerUpdatedAt: number;
  /** Provider id, so a cache written by one provider is never read by another. */
  provider: string;
}

export interface RatesResult {
  snapshot: RateSnapshot;
  /**
   * True when the provider could not be reached and an expired cached
   * snapshot was used instead. The UI labels these rates as cached.
   */
  isFallback: boolean;
}

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  providerUpdatedAt: number;
  fetchedAt: number;
  isFallback: boolean;
}

export interface Conversion extends ExchangeRate {
  amount: number;
  converted: number;
}

export type RateErrorCode =
  | 'network-unavailable'
  | 'provider-error'
  | 'rate-unavailable'
  | 'unsupported-currency'
  | 'invalid-amount';

export interface RateStatus {
  base: string;
  fetchedAt: number;
  providerUpdatedAt: number;
  isStale: boolean;
  provider: string;
}
