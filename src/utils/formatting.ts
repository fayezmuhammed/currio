import { CURRENCIES } from '@/constants/currencies';
import type { CurrencyCode } from '@/types/currency';

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string | undefined, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale ?? ''}|${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    formatters.set(key, formatter);
  }
  return formatter;
}

export interface MoneyParts {
  /** Full localised string, e.g. "₹20,500" or "AED 850.00". */
  text: string;
  /** True when Intl has no symbol and prints the ISO code itself ("AED 850"). */
  symbolIsCode: boolean;
}

export interface FormatOptions {
  locale?: string | undefined;
  /** Fraction digits to show; defaults to the currency's minor units. */
  fractionDigits?: number | undefined;
}

/**
 * Locale-aware money formatting using the narrow symbol where one exists.
 * Callers append the ISO code only when `symbolIsCode` is false.
 */
export function formatMoney(value: number, currency: CurrencyCode, options: FormatOptions = {}): MoneyParts {
  const digits = options.fractionDigits ?? CURRENCIES[currency].minorUnits;
  const formatter = getFormatter(options.locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const parts = formatter.formatToParts(value);
  const symbol = parts.find((p) => p.type === 'currency')?.value ?? '';
  return { text: parts.map((p) => p.value).join(''), symbolIsCode: symbol === currency };
}

/** "₹20,500 INR", or "AED 850" when the symbol already is the code. */
export function formatMoneyWithCode(value: number, currency: CurrencyCode, options: FormatOptions = {}): string {
  const { text, symbolIsCode } = formatMoney(value, currency, options);
  return symbolIsCode ? text : `${text} ${currency}`;
}

/**
 * Sensible precision for a converted amount: whole numbers for large
 * results of whole inputs ("$100 → ₹8,830"), the currency's minor units when
 * the input had cents or the result is small, and more digits for tiny values.
 */
export function displayFractionDigits(source: number, converted: number, currency: CurrencyCode): number {
  const minor = CURRENCIES[currency].minorUnits;
  const abs = Math.abs(converted);
  if (abs > 0 && abs < 0.01) return Math.max(minor, 4);
  if (abs > 0 && abs < 1) return Math.max(minor, 2);
  if (!Number.isInteger(source)) return minor;
  return abs >= 100 ? 0 : minor;
}

/** "₹24.12", "AED 3.6725", "$0.006357": enough digits to be useful for any magnitude. */
export function formatRate(rate: number, currency: CurrencyCode, locale?: string): string {
  const abs = Math.abs(rate);
  const digits = abs >= 10 ? 2 : abs >= 1 ? 4 : Math.min(8, Math.max(2, 3 - Math.floor(Math.log10(abs || 1))));
  const formatted = getFormatter(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: abs >= 1 ? 2 : digits,
    maximumFractionDigits: digits,
  }).formatToParts(rate);
  return formatted.map((p) => p.value).join('');
}

/** Plain localised number for an amount the user selected: "850", "1,299.99". */
export function formatAmount(value: number, locale?: string): string {
  return getFormatter(locale, { maximumFractionDigits: 4 }).format(value);
}

/** "just now", "2 min ago", "3 hr ago", "yesterday", "4 days ago". */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 24) return hours === 1 ? 'Every hour' : `Every ${hours} hours`;
  return hours === 24 ? 'Daily' : `Every ${hours / 24} days`;
}
