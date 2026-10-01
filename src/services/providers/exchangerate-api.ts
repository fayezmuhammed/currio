import { RateError, fetchJson, sanitizeRates, type ExchangeRateProvider } from './types';

interface V6Response {
  result?: unknown;
  base_code?: unknown;
  time_last_update_unix?: unknown;
  conversion_rates?: unknown;
}

/**
 * ExchangeRate-API's keyed v6 endpoint (higher limits, hourly updates on paid
 * plans). Built only into the background service worker.
 */
export function createExchangeRateApiProvider(apiKey: string): ExchangeRateProvider {
  return {
    id: 'exchangerate-api',
    name: 'ExchangeRate-API',
    attributionUrl: 'https://www.exchangerate-api.com',

    async fetchLatest(base, signal) {
      const url = `https://v6.exchangerate-api.com/v6/${encodeURIComponent(apiKey)}/latest/${encodeURIComponent(base)}`;
      const data = (await fetchJson(url, signal)) as V6Response;
      if (data.result !== 'success') throw new RateError('provider-error', 'Provider reported an error');
      const rates = sanitizeRates(data.conversion_rates);
      if (!rates || typeof data.base_code !== 'string') throw new RateError('provider-error', 'Unexpected response');
      const updated = typeof data.time_last_update_unix === 'number' ? data.time_last_update_unix * 1000 : Date.now();
      return { base: data.base_code, rates, providerUpdatedAt: updated };
    },
  };
}
