import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/constants/config';
import { memoryStore } from '@/platform/storage';
import { createHistoryService } from '@/services/history-service';
import { createSettingsService, sanitizeSettings } from '@/services/settings-service';

describe('settings', () => {
  it('defaults to INR with automatic conversion on and page detection off', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.preferredCurrency).toBe('INR');
    expect(DEFAULT_SETTINGS.autoConvert).toBe(true);
    expect(DEFAULT_SETTINGS.pageDetection).toBe(false);
  });

  it('drops malformed values', () => {
    const settings = sanitizeSettings({ preferredCurrency: 'XYZ', refreshIntervalMinutes: -5, autoConvert: 'yes', pageDetection: true });
    expect(settings.preferredCurrency).toBe('INR');
    expect(settings.refreshIntervalMinutes).toBe(DEFAULT_SETTINGS.refreshIntervalMinutes);
    expect(settings.autoConvert).toBe(true);
    expect(settings.pageDetection).toBe(false);
  });

  it('persists updates', async () => {
    const service = createSettingsService(memoryStore());
    await service.update({ preferredCurrency: 'AED', showRateInfo: false });
    expect(await service.get()).toMatchObject({ preferredCurrency: 'AED', showRateInfo: false, autoConvert: true });
  });
});

describe('history', () => {
  it('stores only numbers and codes, never page text', async () => {
    const store = memoryStore();
    const history = createHistoryService(store);
    await history.record(
      { amount: 100, from: 'USD', to: 'INR', converted: 8830, rate: 88.3, providerUpdatedAt: 0, fetchedAt: 0, isFallback: false },
      42,
    );
    expect(await store.get('recentConversion')).toEqual({ amount: 100, from: 'USD', to: 'INR', converted: 8830, rate: 88.3, at: 42 });
  });
});
