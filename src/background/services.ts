import { chromeStore } from '@/platform/storage';
import { createRateCache } from '@/services/cache-service';
import { createExchangeRateService } from '@/services/exchange-rate-service';
import { createHistoryService } from '@/services/history-service';
import { getConfiguredProvider } from '@/services/providers';
import { createSettingsService } from '@/services/settings-service';

/** Service instances wired to real Chrome storage. Background-only. */
export const provider = getConfiguredProvider();
export const settingsService = createSettingsService(chromeStore('sync'));
export const historyService = createHistoryService(chromeStore('local'));
export const rateService = createExchangeRateService({
  provider,
  cache: createRateCache(chromeStore('local')),
  getTtlMs: async () => (await settingsService.get()).refreshIntervalMinutes * 60_000,
});
