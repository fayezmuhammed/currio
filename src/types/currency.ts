import type { CURRENCY_CODES } from '@/constants/currencies';

/** ISO 4217 code of a currency Currio supports. */
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export interface CurrencyDefinition {
  code: CurrencyCode;
  name: string;
  /** Short symbol used in Currio's own UI when Intl has no narrow symbol. */
  symbol: string;
  flag: string;
  /** Number of decimal places in the currency's minor unit (JPY 0, USD 2, KWD 3). */
  minorUnits: number;
  /** ISO 3166-1 alpha-2 regions, used to resolve ambiguous symbols from page hints. */
  regions: readonly string[];
  /**
   * Case-sensitive tokens that identify this currency without ambiguity
   * (symbols and local abbreviations, e.g. "₹", "Rs", "Dhs", "RM").
   */
  symbols: readonly string[];
  /** Case-insensitive words that identify this currency (e.g. "rupees", "dirhams"). */
  names: readonly string[];
}

/** A token that could mean several currencies, e.g. "$" or "¥". */
export interface AmbiguousToken {
  /** Used when no hint resolves the ambiguity. */
  fallback: CurrencyCode;
  candidates: readonly CurrencyCode[];
}

/** Optional page context that helps resolve ambiguous symbols. Never leaves the device. */
export interface ParseHints {
  /** BCP 47 language tag of the page, e.g. "ja" or "en-CA". */
  locale?: string | undefined;
  /** Hostname of the page, e.g. "www.amazon.co.jp". */
  hostname?: string | undefined;
}

export interface ParsedAmount {
  amount: number;
  currency: CurrencyCode;
  /** The trimmed input text the amount was parsed from. */
  originalText: string;
  /** True when the currency came from an ambiguous token such as "$" or "¥". */
  ambiguous: boolean;
  /** Other currencies the ambiguous token could have meant. Empty when unambiguous. */
  alternatives: readonly CurrencyCode[];
}
