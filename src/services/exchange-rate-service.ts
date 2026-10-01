/**
 * Exchange-rate service: the only place that decides when to hit the network.
 *
 *   provider ──▶ service (this) ──▶ cache (chrome.storage.local) ──▶ conversion
 *
 * One snapshot against RATE_BASE_CURRENCY is fetched and every pair is
 * cross-converted locally, so a single request serves all conversions and no
 * amounts or page content ever leave the browser.
 */
import { MAX_FALLBACK_AGE_MS, RATE_BASE_CURRENCY, RATE_REQUEST_TIMEOUT_MS } from '@/constants/config';
import { isSupportedCurrency } from '@/constants/currencies';
import type { CurrencyCode } from '@/types/currency';
import type {
  Conversion,
  ExchangeRate,
  RateSnapshot,
  RateStatus,
  RateTable,
  RatesResult,
} from '@/types/exchange-rate';
import { convertAmount, crossRate, rebaseRates } from '@/utils/currency';
import { isFresh, type RateCache } from './cache-service';
import { RateError, type ExchangeRateProvider } from './providers/types';

/** After a failed request, serve the cache for this long before retrying. */
const FAILURE_BACKOFF_MS = 60_000;

export interface ExchangeRateServiceDeps {
  provider: ExchangeRateProvider;
  cache: RateCache;
  /** Current cache lifetime, read on every call so settings changes apply immediately. */
  getTtlMs: () => Promise<number>;
  now?: () => number;
  timeoutMs?: number;
  base?: string;
}

export interface ExchangeRateService {
  /** Rates for every currency, expressed against `baseCurrency`. */
  getRates(baseCurrency: CurrencyCode): Promise<{ base: CurrencyCode; rates: RateTable; result: RatesResult }>;
  getExchangeRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate>;
  convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<Conversion>;
  /** Cache metadata for the popup, without triggering a fetch. */
  getStatus(): Promise<RateStatus | null>;
  /** Refresh if stale (or always, with `force`). */
  refresh(force?: boolean): Promise<RateStatus>;
}

export function createExchangeRateService(deps: ExchangeRateServiceDeps): ExchangeRateService {
  const { provider, cache, getTtlMs } = deps;
  const now = deps.now ?? Date.now;
  const timeoutMs = deps.timeoutMs ?? RATE_REQUEST_TIMEOUT_MS;
  const base = deps.base ?? RATE_BASE_CURRENCY;

  let inflight: Promise<RateSnapshot> | null = null;
  let lastFailureAt = Number.NEGATIVE_INFINITY;

  /** Fetch from the provider, de-duplicating concurrent requests. */
  function fetchSnapshot(): Promise<RateSnapshot> {
    inflight ??= (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const latest = await provider.fetchLatest(base, controller.signal);
        const snapshot: RateSnapshot = {
          base: latest.base,
          rates: latest.rates,
          providerUpdatedAt: latest.providerUpdatedAt,
          fetchedAt: now(),
          provider: provider.id,
        };
        await cache.write(snapshot);
        return snapshot;
      } catch (error) {
        lastFailureAt = now();
        throw error instanceof RateError ? error : new RateError('network-unavailable', String(error));
      } finally {
        clearTimeout(timer);
        inflight = null;
      }
    })();
    return inflight;
  }

  async function loadRates(force = false): Promise<RatesResult> {
    const cached = await cache.read(provider.id);
    const ttl = await getTtlMs();
    if (!force && cached && isFresh(cached, ttl, now())) return { snapshot: cached, isFallback: false };

    const usableFallback = cached && now() - cached.fetchedAt < MAX_FALLBACK_AGE_MS ? cached : null;
    // Don't hammer a failing provider on every selection: serve the cache during back-off.
    if (!force && usableFallback && now() - lastFailureAt < FAILURE_BACKOFF_MS) {
      return { snapshot: usableFallback, isFallback: true };
    }
    try {
      return { snapshot: await fetchSnapshot(), isFallback: false };
    } catch (error) {
      if (usableFallback) return { snapshot: usableFallback, isFallback: true };
      throw error;
    }
  }

  async function getExchangeRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
    if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) throw new RateError('unsupported-currency');
    const { snapshot, isFallback } = await loadRates();
    const rate = crossRate(snapshot.rates, snapshot.base, from, to);
    if (rate === null) throw new RateError('rate-unavailable');
    return {
      from,
      to,
      rate,
      providerUpdatedAt: snapshot.providerUpdatedAt,
      fetchedAt: snapshot.fetchedAt,
      isFallback,
    };
  }

  return {
    async getRates(baseCurrency) {
      const result = await loadRates();
      const rates = rebaseRates(result.snapshot.rates, result.snapshot.base, baseCurrency);
      if (!rates) throw new RateError('rate-unavailable');
      return { base: baseCurrency, rates, result };
    },

    getExchangeRate,

    async convert(amount, from, to) {
      if (!Number.isFinite(amount)) throw new RateError('invalid-amount');
      const rate = await getExchangeRate(from, to);
      return { ...rate, amount, converted: convertAmount(amount, rate.rate) };
    },

    async getStatus() {
      const cached = await cache.read(provider.id);
      if (!cached) return null;
      return toStatus(cached, !isFresh(cached, await getTtlMs(), now()));
    },

    async refresh(force = false) {
      const { snapshot, isFallback } = await loadRates(force);
      if (isFallback && force) throw new RateError('network-unavailable');
      return toStatus(snapshot, isFallback);
    },
  };
}

function toStatus(snapshot: RateSnapshot, isStale: boolean): RateStatus {
  return {
    base: snapshot.base,
    fetchedAt: snapshot.fetchedAt,
    providerUpdatedAt: snapshot.providerUpdatedAt,
    isStale,
    provider: snapshot.provider,
  };
}
