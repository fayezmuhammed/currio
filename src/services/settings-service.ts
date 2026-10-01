import { DEFAULT_SETTINGS } from '@/constants/config';
import { isSupportedCurrency } from '@/constants/currencies';
import type { KeyValueStore } from '@/platform/storage';
import type { Settings } from '@/types/settings';

/** chrome.storage.sync key holding the settings object. */
export const SETTINGS_KEY = 'settings';

export interface SettingsService {
  get(): Promise<Settings>;
  update(patch: Partial<Settings>): Promise<Settings>;
}

export function createSettingsService(store: KeyValueStore): SettingsService {
  return {
    async get() {
      return sanitizeSettings(await store.get<unknown>(SETTINGS_KEY));
    },
    async update(patch) {
      const next = sanitizeSettings({ ...(await this.get()), ...patch });
      await store.set(SETTINGS_KEY, next);
      return next;
    },
  };
}

/** Merge stored values over defaults, dropping anything malformed (e.g. from an older version). */
export function sanitizeSettings(value: unknown): Settings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof Settings, unknown>>;
  const bool = (key: 'autoConvert' | 'showRateInfo' | 'pageDetection' | 'onboardingCompleted'): boolean =>
    typeof raw[key] === 'boolean' ? raw[key] : DEFAULT_SETTINGS[key];
  const interval = raw.refreshIntervalMinutes;
  return {
    preferredCurrency:
      typeof raw.preferredCurrency === 'string' && isSupportedCurrency(raw.preferredCurrency)
        ? raw.preferredCurrency
        : DEFAULT_SETTINGS.preferredCurrency,
    refreshIntervalMinutes:
      typeof interval === 'number' && Number.isFinite(interval) && interval >= 15 && interval <= 10_080
        ? interval
        : DEFAULT_SETTINGS.refreshIntervalMinutes,
    autoConvert: bool('autoConvert'),
    showRateInfo: bool('showRateInfo'),
    // V2 feature: forced off until page detection ships.
    pageDetection: false,
    onboardingCompleted: bool('onboardingCompleted'),
  };
}
