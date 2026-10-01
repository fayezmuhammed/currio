import { RateError, fetchJson, sanitizeRates, type ExchangeRateProvider } from './types';

interface OpenErApiResponse {
  result?: unknown;
  base_code?: unknown;
  time_last_update_unix?: unknown;
  rates?: unknown;
}

/**
 * ExchangeRate-API's open endpoint: free, no key, CORS-enabled, ~160
 * currencies, updated daily. Terms require attribution, shown in the popup.
 * https://www.exchangerate-api.com/docs/free
 */
export const openErApiProvider: ExchangeRateProvider = {
  id: 'open-er-api',
  name: 'ExchangeRate-API',
  attributionUrl: 'https://www.exchangerate-api.com',

  async fetchLatest(base, signal) {
    const data = (await fetchJson(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, signal)) as OpenErApiResponse;
    if (data.result !== 'success') throw new RateError('provider-error', 'Provider reported an error');
    const rates = sanitizeRates(data.rates);
    if (!rates || typeof data.base_code !== 'string') throw new RateError('provider-error', 'Unexpected response');
    const updated = typeof data.time_last_update_unix === 'number' ? data.time_last_update_unix * 1000 : Date.now();
    return { base: data.base_code, rates, providerUpdatedAt: updated };
  },
};
