import type { CurrencyCode } from './currency';

export interface Settings {
  preferredCurrency: CurrencyCode;
  /** How long cached rates are considered fresh, in minutes. */
  refreshIntervalMinutes: number;
  /** Show the conversion card automatically when a price is selected. */
  autoConvert: boolean;
  /** Show the "1 AED = ₹24.12 · Updated 2 min ago" line on the card. */
  showRateInfo: boolean;
  /** V2: detect and annotate prices on pages. Always off in V1. */
  pageDetection: boolean;
  onboardingCompleted: boolean;
}

/** The last conversion, shown in the popup. Contains no page text or URL. */
export interface RecentConversion {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  converted: number;
  rate: number;
  at: number;
}
