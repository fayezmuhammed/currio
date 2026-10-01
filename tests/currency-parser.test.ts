import { describe, expect, it } from 'vitest';
import { normalizeText, parseCurrency, parseNumber } from '@/content/currency-parser';

const NBSP = String.fromCharCode(0xa0);
const NNBSP = String.fromCharCode(0x202f);
const RLM = String.fromCharCode(0x200f);
const arabicDigits = (s: string): string => s.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));

function expectParsed(text: string, amount: number, currency: string): void {
  const parsed = parseCurrency(text);
  expect(parsed, `"${text}"`).not.toBeNull();
  expect(parsed?.amount, `"${text}" amount`).toBeCloseTo(amount, 6);
  expect(parsed?.currency, `"${text}" currency`).toBe(currency);
}

describe('parseCurrency — required formats', () => {
  it.each([
    ['$100', 100, 'USD'],
    ['$ 100', 100, 'USD'],
    ['USD 100', 100, 'USD'],
    ['100 USD', 100, 'USD'],
    ['€250', 250, 'EUR'],
    ['EUR 250', 250, 'EUR'],
    ['250 EUR', 250, 'EUR'],
    ['€1,299.99', 1299.99, 'EUR'],
    ['AED 850', 850, 'AED'],
    ['850 AED', 850, 'AED'],
    ['₹5,000', 5000, 'INR'],
    ['INR 5,000', 5000, 'INR'],
    ['5,000 INR', 5000, 'INR'],
    ['1,299.99 USD', 1299.99, 'USD'],
    ['USD 1,299.99', 1299.99, 'USD'],
    ['1,299.99 SAR', 1299.99, 'SAR'],
    ['1,000.50 SAR', 1000.5, 'SAR'],
  ])('%s → %d %s', (text, amount, currency) => expectParsed(text, amount, currency));

  it('returns the documented shape', () => {
    expect(parseCurrency('  AED 850 ')).toEqual({
      amount: 850,
      currency: 'AED',
      originalText: 'AED 850',
      ambiguous: false,
      alternatives: [],
    });
  });
});

describe('parseCurrency — every supported currency by code', () => {
  it.each(['USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SGD', 'MYR', 'THB', 'HKD', 'NZD', 'ZAR'])(
    '%s',
    (code) => {
      expectParsed(`${code} 42`, 42, code);
      expectParsed(`42 ${code}`, 42, code);
    },
  );
});

describe('parseCurrency — symbols and local abbreviations', () => {
  it.each([
    ['£49.99', 49.99, 'GBP'],
    ['Rs. 1,500', 1500, 'INR'],
    ['Rs 1500', 1500, 'INR'],
    ['Dhs 850', 850, 'AED'],
    ['850 د.إ', 850, 'AED'],
    ['SR 120', 120, 'SAR'],
    ['QR 75', 75, 'QAR'],
    ['KD 12.500', 12.5, 'KWD'],
    ['RM 39.90', 39.9, 'MYR'],
    ['฿1,200', 1200, 'THB'],
    ['HK$88', 88, 'HKD'],
    ['A$59', 59, 'AUD'],
    ['C$ 20', 20, 'CAD'],
    ['NZ$15', 15, 'NZD'],
    ['S$9.90', 9.9, 'SGD'],
    ['US$100', 100, 'USD'],
    ['R 250', 250, 'ZAR'],
    ['CHF 1,250.50', 1250.5, 'CHF'],
    ['Fr. 20', 20, 'CHF'],
    ['CN¥99', 99, 'CNY'],
    ['JP¥1,000', 1000, 'JPY'],
    ['100元', 100, 'CNY'],
    ['3000円', 3000, 'JPY'],
  ])('%s → %d %s', (text, amount, currency) => expectParsed(text, amount, currency));

  it('accepts lowercase codes and spelled-out names', () => {
    expectParsed('usd 25', 25, 'USD');
    expectParsed('500 rupees', 500, 'INR');
    expectParsed('850 dirhams', 850, 'AED');
    expectParsed('20 euros', 20, 'EUR');
    expectParsed('1,000 yen', 1000, 'JPY');
  });

  it('accepts amounts glued to codes', () => {
    expectParsed('USD100', 100, 'USD');
    expectParsed('850AED', 850, 'AED');
    expectParsed('100€', 100, 'EUR');
  });
});

describe('parseCurrency — separators', () => {
  it.each([
    ['€1.299,99', 1299.99, 'EUR'],
    ['1.299,99 €', 1299.99, 'EUR'],
    ['12,50 €', 12.5, 'EUR'],
    ['1.250 €', 1250, 'EUR'],
    ['USD 1,000,000', 1_000_000, 'USD'],
    ['₹5,00,000', 500_000, 'INR'],
    ['₹1,23,45,678.50', 12_345_678.5, 'INR'],
    ["CHF 1'299.50", 1299.5, 'CHF'],
    ['$0.99', 0.99, 'USD'],
    ['$0.125', 0.125, 'USD'],
    ['$3.499', 3.499, 'USD'],
    ['¥1,000', 1000, 'JPY'],
    ['¥1.000', 1000, 'JPY'],
    ['KWD 1.250', 1.25, 'KWD'],
    ['BHD 1,250', 1250, 'BHD'],
    ['OMR 0.500', 0.5, 'OMR'],
  ])('%s → %d %s', (text, amount, currency) => expectParsed(text, amount, currency));

  it('handles non-breaking and narrow spaces used as separators', () => {
    expectParsed(`1${NNBSP}299,99${NBSP}€`, 1299.99, 'EUR');
    expectParsed(`AED${NBSP}850`, 850, 'AED');
    expectParsed(`R 1 299,99`, 1299.99, 'ZAR');
  });

  it('uses the page language for "1,250" vs "1.250"', () => {
    expect(parseCurrency('1,250 USD', { locale: 'de-DE' })?.amount).toBe(1.25);
    expect(parseCurrency('1.250 USD', { locale: 'de-DE' })?.amount).toBe(1250);
    expect(parseCurrency('1,250 USD', { locale: 'en-US' })?.amount).toBe(1250);
    expect(parseCurrency('1.250 EUR', { locale: 'en-IE' })?.amount).toBe(1.25);
  });

  it('reads Arabic-Indic digits and separators', () => {
    expectParsed(`${arabicDigits('850')} د.إ`, 850, 'AED');
    expectParsed(`SAR ${arabicDigits('1')}${String.fromCharCode(0x066c)}${arabicDigits('299')}${String.fromCharCode(0x066b)}${arabicDigits('99')}`, 1299.99, 'SAR');
  });

  it('ignores bidi marks around RTL currency text', () => {
    expectParsed(`${RLM}850${RLM} ${RLM}د.إ`, 850, 'AED');
  });
});

describe('parseCurrency — magnitudes, signs and context', () => {
  it.each([
    ['$5k', 5000, 'USD'],
    ['AED 1.2M', 1_200_000, 'AED'],
    ['1.2M AED', 1_200_000, 'AED'],
    ['$2bn', 2e9, 'USD'],
    ['₹2 crore', 2e7, 'INR'],
    ['₹5 lakh', 5e5, 'INR'],
    ['USD 3 million', 3e6, 'USD'],
  ])('%s → %d %s', (text, amount, currency) => expectParsed(text, amount, currency));

  it('does not treat spaced single letters as magnitudes', () => {
    expect(parseCurrency('100 MYR')).toMatchObject({ amount: 100, currency: 'MYR' });
    expect(parseCurrency('$5 k')).toMatchObject({ amount: 5, currency: 'USD' });
  });

  it('handles negative amounts', () => {
    expectParsed('-$50', -50, 'USD');
    expectParsed('$-50', -50, 'USD');
    expectParsed(`${String.fromCharCode(0x2212)}€20`, -20, 'EUR');
  });

  it('does not read a range dash as a minus sign', () => {
    expectParsed('$100-$200', 100, 'USD');
    expectParsed('AED 100 - 200', 100, 'AED');
  });

  it('finds a price inside a short phrase', () => {
    expectParsed('Hotel: AED 850 per night', 850, 'AED');
    expectParsed('Buy 2 for $10', 10, 'USD');
    expectParsed('Total (incl. VAT): €1.299,00', 1299, 'EUR');
    expectParsed('$100/night', 100, 'USD');
  });

  it('prefers an explicit code over a symbol', () => {
    expect(parseCurrency('$100 CAD')).toMatchObject({ amount: 100, currency: 'CAD', ambiguous: false });
    expect(parseCurrency('¥1,000 CNY')).toMatchObject({ amount: 1000, currency: 'CNY', ambiguous: false });
    expect(parseCurrency('$100 USD')).toMatchObject({ currency: 'USD', ambiguous: false });
  });
});

describe('parseCurrency — ambiguous symbols', () => {
  it('flags ¥ as ambiguous and falls back to JPY', () => {
    const parsed = parseCurrency('¥1,000');
    expect(parsed).toMatchObject({ amount: 1000, currency: 'JPY', ambiguous: true, alternatives: ['CNY'] });
  });

  it('resolves ¥ to CNY from page hints', () => {
    expect(parseCurrency('¥99', { locale: 'zh-CN' })?.currency).toBe('CNY');
    expect(parseCurrency('¥99', { locale: 'zh' })?.currency).toBe('CNY');
    expect(parseCurrency('¥99', { hostname: 'www.taobao.cn' })?.currency).toBe('CNY');
    expect(parseCurrency('¥99', { locale: 'ja', hostname: 'example.com' })?.currency).toBe('JPY');
    expect(parseCurrency('¥99', { hostname: 'www.amazon.co.jp' })?.currency).toBe('JPY');
  });

  it('keeps alternatives so the user can correct the guess', () => {
    const parsed = parseCurrency('¥99', { locale: 'zh-CN' });
    expect(parsed).toMatchObject({ currency: 'CNY', ambiguous: true, alternatives: ['JPY'] });
  });

  it('defaults $ to USD and resolves it from hints', () => {
    expect(parseCurrency('$20')).toMatchObject({ currency: 'USD', ambiguous: true });
    expect(parseCurrency('$20')?.alternatives).toContain('CAD');
    expect(parseCurrency('$20', { locale: 'en-CA' })?.currency).toBe('CAD');
    expect(parseCurrency('$20', { locale: 'en-AU' })?.currency).toBe('AUD');
    expect(parseCurrency('$20', { hostname: 'shop.co.nz' })?.currency).toBe('NZD');
    expect(parseCurrency('$20', { hostname: 'store.sg' })?.currency).toBe('SGD');
    expect(parseCurrency('$20', { locale: 'en-US', hostname: 'example.ca' })?.currency).toBe('USD');
  });

  it('resolves ambiguous names', () => {
    expect(parseCurrency('50 dollars')).toMatchObject({ currency: 'USD', ambiguous: true });
    expect(parseCurrency('50 riyals', { hostname: 'shop.qa' })?.currency).toBe('QAR');
    expect(parseCurrency('50 riyals')?.currency).toBe('SAR');
  });

  it('rejects $ glued to letters that denote other currencies', () => {
    expect(parseCurrency('R$ 100')).toBeNull(); // Brazilian real
    expect(parseCurrency('MX$100')).toBeNull(); // Mexican peso
    expect(parseCurrency('NT$500')).toBeNull(); // New Taiwan dollar
  });
});

describe('parseCurrency — invalid input', () => {
  it.each([
    [''],
    ['   '],
    ['100'],
    ['USD'],
    ['$'],
    ['hello world'],
    ['100 BRL'],
    ['₩10,000'],
    ['$1,2,3'],
    ['$1,00,0'],
    ['USD 1.2.3,4'],
    ['EUR 1,2.3.4'],
    ['call 800 555 1234'],
    ['MEUR 100'],
    ['10 XEUR'],
  ])('%j → null', (text) => {
    expect(parseCurrency(text)).toBeNull();
  });

  it('rejects selections that are too long to be a price', () => {
    expect(parseCurrency(`AED 850 ${'lorem ipsum '.repeat(20)}`)).toBeNull();
  });

  it('rejects absurdly large amounts', () => {
    expect(parseCurrency('$9999999999999999999')).toBeNull();
  });

  it('never throws on non-string input', () => {
    expect(parseCurrency(undefined as unknown as string)).toBeNull();
    expect(parseCurrency(42 as unknown as string)).toBeNull();
  });
});

describe('parseNumber', () => {
  it('parses plain and grouped numbers', () => {
    expect(parseNumber('100', 'USD')).toBe(100);
    expect(parseNumber('1,299.99', 'USD')).toBe(1299.99);
    expect(parseNumber('1.299,99', 'EUR')).toBe(1299.99);
    expect(parseNumber('5,00,000', 'INR')).toBe(500000);
    expect(parseNumber('1234,567', 'USD')).toBe(1234.567);
  });

  it('rejects broken grouping', () => {
    expect(parseNumber('1,2,3', 'USD')).toBeNull();
    expect(parseNumber('12,34,5', 'USD')).toBeNull();
    expect(parseNumber('1,234.5.6', 'USD')).toBeNull();
  });
});

describe('normalizeText', () => {
  it('maps full-width characters and collapses whitespace', () => {
    const fullwidth = String.fromCharCode(0xffe5, 0xff11, 0xff10, 0xff10);
    expect(normalizeText(fullwidth)).toBe('¥100');
    expect(normalizeText(`  AED${NBSP}${NBSP}850\n`)).toBe('AED 850');
  });
});
