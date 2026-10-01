import type { RateErrorCode, RateTable } from '@/types/exchange-rate';

export interface ProviderRates {
  base: string;
  rates: RateTable;
  /** When the provider last published these rates (ms since epoch). */
  providerUpdatedAt: number;
}

/**
 * Anything that can return the latest rates for a base currency. To switch
 * providers, implement this interface and register it in providers/index.ts.
 */
export interface ExchangeRateProvider {
  /** Stable id, used to namespace the cache. */
  readonly id: string;
  /** Shown in the popup for attribution. */
  readonly name: string;
  readonly attributionUrl: string;
  fetchLatest(base: string, signal: AbortSignal): Promise<ProviderRates>;
}

export class RateError extends Error {
  readonly code: RateErrorCode;

  constructor(code: RateErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'RateError';
    this.code = code;
  }
}

/** Keep only finite, positive numeric rates from an untrusted payload. */
export function sanitizeRates(input: unknown): RateTable | null {
  if (typeof input !== 'object' || input === null) return null;
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(input)) {
    if (/^[A-Z]{3}$/.test(code) && typeof value === 'number' && Number.isFinite(value) && value > 0) {
      rates[code] = value;
    }
  }
  return Object.keys(rates).length > 0 ? rates : null;
}

/** fetch() that maps network failures and HTTP errors onto RateError codes. */
export async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
  } catch (error) {
    throw new RateError('network-unavailable', error instanceof Error ? error.message : String(error));
  }
  if (!response.ok) throw new RateError('provider-error', `HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new RateError('provider-error', 'Malformed JSON');
  }
}
