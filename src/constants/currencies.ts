import type { AmbiguousToken, CurrencyCode, CurrencyDefinition } from '@/types/currency';

/**
 * Every currency Currio supports. To add a currency:
 *   1. Add its ISO code here.
 *   2. Add its definition to CURRENCIES below.
 *   3. If it shares a symbol with others (e.g. "$"), add it to AMBIGUOUS_TOKENS.
 * The parser, pickers and conversion logic all derive from this registry.
 */
export const CURRENCY_CODES = [
  'USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'CAD',
  'AUD', 'JPY', 'CNY', 'CHF', 'SGD', 'MYR', 'THB', 'HKD', 'NZD', 'ZAR',
] as const;

export const CURRENCIES: Readonly<Record<CurrencyCode, CurrencyDefinition>> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', minorUnits: 2, regions: ['US'], symbols: ['USD$', 'US$', 'U$S'], names: [] },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', minorUnits: 2, regions: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'PT', 'FI', 'GR'], symbols: ['€'], names: ['euro', 'euros'] },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', minorUnits: 2, regions: ['GB', 'UK'], symbols: ['£'], names: ['pound sterling', 'pounds sterling', 'sterling', 'pound', 'pounds', 'quid'] },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', minorUnits: 2, regions: ['IN'], symbols: ['₹', 'Rs.', 'Rs', 'RS.', 'RS'], names: ['rupee', 'rupees'] },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', minorUnits: 2, regions: ['AE'], symbols: ['د.إ', 'Dhs.', 'Dhs', 'DHS', 'Dh', 'DH'], names: ['dirham', 'dirhams'] },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', minorUnits: 2, regions: ['SA'], symbols: ['ر.س', '﷼', 'SR'], names: ['saudi riyal', 'saudi riyals'] },
  QAR: { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦', minorUnits: 2, regions: ['QA'], symbols: ['ر.ق', 'QR'], names: ['qatari riyal', 'qatari riyals'] },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', minorUnits: 3, regions: ['KW'], symbols: ['د.ك', 'KD'], names: ['kuwaiti dinar', 'kuwaiti dinars'] },
  OMR: { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲', minorUnits: 3, regions: ['OM'], symbols: ['ر.ع.', 'ر.ع', 'RO'], names: ['omani rial', 'omani rials'] },
  BHD: { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', minorUnits: 3, regions: ['BH'], symbols: ['.د.ب', 'د.ب', 'BD'], names: ['bahraini dinar', 'bahraini dinars'] },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', minorUnits: 2, regions: ['CA'], symbols: ['CA$', 'C$', 'CAN$'], names: ['canadian dollar', 'canadian dollars'] },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', minorUnits: 2, regions: ['AU'], symbols: ['AU$', 'A$', 'AUD$'], names: ['australian dollar', 'australian dollars'] },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', minorUnits: 0, regions: ['JP'], symbols: ['JP¥', '円'], names: ['yen'] },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', minorUnits: 2, regions: ['CN'], symbols: ['CN¥', 'RMB', '元'], names: ['yuan', 'renminbi'] },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', minorUnits: 2, regions: ['CH', 'LI'], symbols: ['SFr.', 'Fr.'], names: ['swiss franc', 'swiss francs', 'franc', 'francs'] },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', minorUnits: 2, regions: ['SG'], symbols: ['SG$', 'S$'], names: ['singapore dollar', 'singapore dollars'] },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', minorUnits: 2, regions: ['MY'], symbols: ['RM'], names: ['ringgit'] },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', minorUnits: 2, regions: ['TH'], symbols: ['฿'], names: ['baht'] },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', minorUnits: 2, regions: ['HK'], symbols: ['HK$'], names: ['hong kong dollar', 'hong kong dollars'] },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', minorUnits: 2, regions: ['NZ'], symbols: ['NZ$'], names: ['new zealand dollar', 'new zealand dollars'] },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', minorUnits: 2, regions: ['ZA'], symbols: ['R'], names: ['rand'] },
};

/**
 * Tokens shared by several currencies. Symbols are case-sensitive; words are
 * matched case-insensitively. The parser resolves these from page hints
 * (language, top-level domain) and otherwise uses `fallback`, flagging the
 * result as ambiguous so the UI can offer the alternatives.
 */
export const AMBIGUOUS_SYMBOLS: Readonly<Record<string, AmbiguousToken>> = {
  $: { fallback: 'USD', candidates: ['USD', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD'] },
  '¥': { fallback: 'JPY', candidates: ['JPY', 'CNY'] },
};

export const AMBIGUOUS_NAMES: Readonly<Record<string, AmbiguousToken>> = {
  dollar: { fallback: 'USD', candidates: ['USD', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD'] },
  dollars: { fallback: 'USD', candidates: ['USD', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD'] },
  riyal: { fallback: 'SAR', candidates: ['SAR', 'QAR', 'OMR'] },
  riyals: { fallback: 'SAR', candidates: ['SAR', 'QAR', 'OMR'] },
  rial: { fallback: 'OMR', candidates: ['OMR', 'SAR', 'QAR'] },
  rials: { fallback: 'OMR', candidates: ['OMR', 'SAR', 'QAR'] },
  dinar: { fallback: 'KWD', candidates: ['KWD', 'BHD'] },
  dinars: { fallback: 'KWD', candidates: ['KWD', 'BHD'] },
};

const CODE_SET: ReadonlySet<string> = new Set(CURRENCY_CODES);

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return CODE_SET.has(code);
}

export function getCurrency(code: CurrencyCode): CurrencyDefinition {
  return CURRENCIES[code];
}

export const CURRENCY_LIST: readonly CurrencyDefinition[] = CURRENCY_CODES.map((code) => CURRENCIES[code]);

/** Shown first in onboarding. */
export const POPULAR_CURRENCIES: readonly CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'JPY', 'AUD'];
