import type { Settings } from '@/types/settings';

/**
 * How long fetched rates stay fresh before Currio asks the provider again.
 * Users can override this in Settings. The default provider publishes new
 * rates about once a day, so refreshing more often than hourly gains nothing.
 */
export const DEFAULT_CACHE_TTL_MINUTES = 360;

/** Choices offered in Settings → Exchange rate refresh. */
export const REFRESH_INTERVAL_OPTIONS_MINUTES = [60, 360, 720, 1440] as const;

/** Snapshots older than this are never used, even as an offline fallback. */
export const MAX_FALLBACK_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Abort a provider request after this long and fall back to the cache. */
export const RATE_REQUEST_TIMEOUT_MS = 6000;

/**
 * All rates are fetched against one base and cross-converted locally, so one
 * request covers every pair and no amounts are ever sent anywhere.
 */
export const RATE_BASE_CURRENCY = 'USD';

/** Selections longer than this are not treated as a price. */
export const MAX_SELECTION_LENGTH = 120;

/** Wait this long for a conversion before showing the loading state, to avoid a flash. */
export const LOADING_STATE_DELAY_MS = 90;

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  preferredCurrency: 'INR',
  refreshIntervalMinutes: DEFAULT_CACHE_TTL_MINUTES,
  autoConvert: true,
  showRateInfo: true,
  pageDetection: false,
  onboardingCompleted: false,
};

export const COMMAND_CONVERT_SELECTION = 'convert-selection';
export const CONTEXT_MENU_ID = 'currio-convert-selection';
